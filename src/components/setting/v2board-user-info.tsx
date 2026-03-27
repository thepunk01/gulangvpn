import { Logout } from '@mui/icons-material'
import { Box, Button, Card, CircularProgress, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { V2BoardService, type V2BoardUserInfo } from '@/services/v2board'
import { showNotice } from '@/services/notice-service'

export const V2BoardUserInfo = () => {
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState<V2BoardUserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    V2BoardService.isLoggedIn()
      .then((loggedIn) => {
        if (!loggedIn) {
          setLoading(false)
          return
        }
        return V2BoardService.getUserInfo()
      })
      .then((info) => {
        if (info) setUserInfo(info)
      })
      .catch((e: any) => {
        setError(e?.message || '获取用户信息失败')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    try {
      await V2BoardService.logout()
      showNotice.success('已退出登录')
      navigate('/v2board-login')
    } catch (e: any) {
      showNotice.error(e?.message || '退出失败')
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  if (!userInfo) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          未登录 V2Board 账号
        </Typography>
        <Button
          variant="contained"
          size="small"
          onClick={() => navigate('/v2board-login')}
          sx={{ mt: 1 }}
        >
          登录 / 注册
        </Button>
      </Box>
    )
  }

  const usedTraffic = userInfo.upload + userInfo.download
  const totalTraffic = userInfo.transfer_enable
  const usagePercent = totalTraffic > 0 ? (usedTraffic / totalTraffic) * 100 : 0

  return (
    <Card sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {userInfo.email}
        </Typography>
        <Button
          size="small"
          startIcon={<Logout />}
          onClick={handleLogout}
          color="error"
        >
          退出
        </Button>
      </Box>

      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            流量使用
          </Typography>
          <Typography variant="caption">
            {V2BoardService.formatTraffic(usedTraffic)} / {V2BoardService.formatTraffic(totalTraffic)}
          </Typography>
        </Box>
        <Box sx={{ height: 6, bgcolor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
          <Box
            sx={{
              height: '100%',
              width: `${Math.min(usagePercent, 100)}%`,
              bgcolor: usagePercent > 80 ? 'error.main' : 'primary.main',
              borderRadius: 1,
            }}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          到期时间: {V2BoardService.formatDate(userInfo.expired_at)}
        </Typography>
        {userInfo.balance > 0 && (
          <Typography variant="caption" color="text.secondary">
            余额: ¥{userInfo.balance.toFixed(2)}
          </Typography>
        )}
      </Box>
    </Card>
  )
}
