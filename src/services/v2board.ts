import { invoke } from '@tauri-apps/api/core'

export interface V2BoardUserInfo {
  email: string
  transfer_enable: number
  upload: number
  download: number
  expired_at: number
  created_at: number
  plan_id: number | null
  uuid: string
  balance: number
  banned: number
}

export const V2BoardService = {
  /** 登录 */
  async login(email: string, password: string): Promise<string> {
    return invoke<string>('v2board_login', { email, password })
  },

  /** 注册 */
  async register(
    email: string,
    password: string,
    inviteCode?: string,
  ): Promise<string> {
    return invoke<string>('v2board_register', {
      email,
      password,
      inviteCode,
    })
  },

  /** 是否已登录 */
  async isLoggedIn(): Promise<boolean> {
    return invoke<boolean>('v2board_is_logged_in')
  },

  /** 获取当前 Token */
  async getToken(): Promise<string | null> {
    return invoke<string | null>('v2board_get_token')
  },

  /** 获取用户信息 */
  async getUserInfo(): Promise<V2BoardUserInfo> {
    return invoke<V2BoardUserInfo>('v2board_get_user_info')
  },

  /** 获取订阅链接 */
  async getSubscribeUrl(): Promise<string> {
    return invoke<string>('v2board_get_subscribe_url')
  },

  /** 退出登录 */
  async logout(): Promise<void> {
    return invoke<void>('v2board_logout')
  },

  /** 格式化流量大小 */
  formatTraffic(bytes: number): string {
    if (bytes === 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`
  },

  /** 格式化时间戳为日期 */
  formatDate(timestamp: number): string {
    if (timestamp === 0) return '未设置'
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  },
}
