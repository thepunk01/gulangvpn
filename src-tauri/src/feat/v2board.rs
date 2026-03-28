use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

/// V2Board API 配置
const API_BASE: &str = "https://gulangvps.com/api/v1";

/// 全局 HTTP 客户端
static HTTP_CLIENT: once_cell::sync::Lazy<Client> = once_cell::sync::Lazy::new(|| {
    Client::builder()
        .user_agent("clash-verge-rev/2.4.8")
        .build()
        .unwrap()
});

/// 用户认证 Token 存储
pub struct V2BoardState {
    pub token: Mutex<Option<String>>,
    pub auth_data: Mutex<Option<String>>,
}

impl Default for V2BoardState {
    fn default() -> Self {
        Self {
            token: Mutex::new(None),
            auth_data: Mutex::new(None),
        }
    }
}

#[derive(Debug, Deserialize)]
struct ApiResponse<T> {
    data: Option<T>,
    #[serde(default)]
    message: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginResp {
    pub token: Option<String>,
    pub auth_data: Option<String>,
}

#[derive(Debug, Serialize)]
struct LoginReq {
    email: String,
    password: String,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct UserInfo {
    pub email: String,
    #[serde(rename = "transfer_enable")]
    pub transfer_enable: u64,
    #[serde(rename = "upload")]
    pub upload: u64,
    #[serde(rename = "download")]
    pub download: u64,
    #[serde(rename = "expired_at")]
    pub expired_at: i64,
    #[serde(rename = "created_at")]
    pub created_at: i64,
    #[serde(rename = "plan_id")]
    pub plan_id: Option<i64>,
    #[serde(rename = "uuid")]
    pub uuid: String,
    #[serde(rename = "balance")]
    pub balance: f64,
    #[serde(rename = "banned")]
    pub banned: i32,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct SubscribeResp {
    #[serde(rename = "plan_id")]
    pub plan_id: Option<i64>,
    pub token: Option<String>,
    #[serde(rename = "expired_at")]
    pub expired_at: i64,
    pub u: u64,
    pub d: u64,
    #[serde(rename = "transfer_enable")]
    pub transfer_enable: u64,
    pub email: String,
    #[serde(rename = "subscribe_url")]
    pub subscribe_url: String,
}

/// V2Board 登录
#[tauri::command]
pub async fn v2board_login(
    email: String,
    password: String,
    state: State<'_, V2BoardState>,
) -> Result<String, String> {
    let url = format!("{}/passport/auth/login", API_BASE);

    let resp = HTTP_CLIENT
        .post(&url)
        .json(&LoginReq { email, password })
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = resp.status();
    let body: ApiResponse<LoginResp> = resp.json().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(body.message.unwrap_or_else(|| "登录失败".into()));
    }

    let data = body.data.ok_or("响应数据为空")?;

    let token = data.token.ok_or("未获取到 token")?;
    let auth_data = data.auth_data.unwrap_or_default();

    // 保存 token
    *state.token.lock().unwrap() = Some(token.clone());
    *state.auth_data.lock().unwrap() = Some(auth_data);

    Ok(token)
}

/// V2Board 注册
#[tauri::command]
pub async fn v2board_register(
    email: String,
    password: String,
    invite_code: Option<String>,
    state: State<'_, V2BoardState>,
) -> Result<String, String> {
    let url = format!("{}/passport/auth/register", API_BASE);

    #[derive(Serialize)]
    struct RegisterReq<'a> {
        email: &'a str,
        password: &'a str,
        invite_code: Option<&'a str>,
    }

    let resp = HTTP_CLIENT
        .post(&url)
        .json(&RegisterReq {
            email: &email,
            password: &password,
            invite_code: invite_code.as_deref(),
        })
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = resp.status();
    let body: ApiResponse<LoginResp> = resp.json().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(body.message.unwrap_or_else(|| "注册失败".into()));
    }

    let data = body.data.ok_or("响应数据为空")?;

    let token = data.token.ok_or("未获取到 token")?;
    let auth_data = data.auth_data.unwrap_or_default();

    *state.token.lock().unwrap() = Some(token.clone());
    *state.auth_data.lock().unwrap() = Some(auth_data);

    Ok(token)
}

/// 获取当前登录状态
#[tauri::command]
pub fn v2board_is_logged_in(state: State<'_, V2BoardState>) -> bool {
    state.token.lock().unwrap().is_some()
}

/// 获取当前 Token
#[tauri::command]
pub fn v2board_get_token(state: State<'_, V2BoardState>) -> Option<String> {
    state.token.lock().unwrap().clone()
}

/// 获取用户信息
#[tauri::command]
pub async fn v2board_get_user_info(
    state: State<'_, V2BoardState>,
) -> Result<UserInfo, String> {
    let token = state.token.lock().unwrap().clone()
        .ok_or("未登录，请先登录")?;

    let url = format!("{}/user/info", API_BASE);

    let resp = HTTP_CLIENT
        .get(&url)
        .header("Authorization", &*format!("Bearer {}", token))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = resp.status();
    let body: ApiResponse<UserInfo> = resp.json().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(body.message.unwrap_or_else(|| "获取用户信息失败".into()));
    }

    body.data.ok_or_else(|| "响应数据为空".to_string())
}

/// 获取订阅信息（含订阅链接）
#[tauri::command]
pub async fn v2board_get_subscribe_url(
    state: State<'_, V2BoardState>,
) -> Result<String, String> {
    let token = state.token.lock().unwrap().clone()
        .ok_or("未登录，请先登录")?;

    let url = format!("{}/user/getSubscribe", API_BASE);

    let resp = HTTP_CLIENT
        .get(&url)
        .header("Authorization", &*format!("Bearer {}", token))
        .header("Accept", "application/json")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = resp.status();
    let body: ApiResponse<SubscribeResp> = resp.json().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(body.message.unwrap_or_else(|| "获取订阅信息失败".into()));
    }

    let data = body.data.ok_or_else(|| "响应数据为空".to_string())?;
    Ok(data.subscribe_url)
}

/// 退出登录
#[tauri::command]
pub fn v2board_logout(state: State<'_, V2BoardState>) {
    *state.token.lock().unwrap() = None;
    *state.auth_data.lock().unwrap() = None;
}
