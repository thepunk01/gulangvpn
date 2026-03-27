import { Visibility, VisibilityOff } from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useLockFn } from 'ahooks'
import { V2BoardService } from '@/services/v2board'
import { useTranslation } from 'react-i18next'
import { importProfile } from '@/services/cmds'

export default function V2BoardLoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = useLockFn(async () => {
    if (!email || !password) {
      setError('请输入邮箱和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      await V2BoardService.login(email, password)
      const subscribeUrl = await V2BoardService.getSubscribeUrl()
      await importProfile(subscribeUrl, { with_proxy: true })
      navigate('/')
    } catch (e: any) {
      setError(e?.message || e?.toString() || '登录失败')
    } finally {
      setLoading(false)
    }
  })

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom textAlign="center">
          孤狼加速 - 登录
        </Typography>

        <Box sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="邮箱"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            disabled={loading}
          />
          <TextField
            fullWidth
            label="密码"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {error && (
            <Typography color="error" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}

          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '登录'}
          </Button>

          <Button
            fullWidth
            variant="text"
            sx={{ mt: 1 }}
            onClick={() => navigate('/v2board-register')}
            disabled={loading}
          >
            没有账号？去注册
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
