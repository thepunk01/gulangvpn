import { Visibility, VisibilityOff } from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useLockFn } from 'ahooks'
import { V2BoardService } from '@/services/v2board'
import { importProfile } from '@/services/cmds'

export default function V2BoardRegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleRegister = useLockFn(async () => {
    if (!email || !password) {
      setError('请输入邮箱和密码')
      return
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    if (password.length < 8) {
      setError('密码长度不能少于8位')
      return
    }
    setLoading(true)
    setError('')
    try {
      await V2BoardService.register(email, password, inviteCode || undefined)
      // 注册成功后自动获取订阅并导入
      const subscribeUrl = await V2BoardService.getSubscribeUrl()
      await importProfile(subscribeUrl, { with_proxy: true })
      navigate('/')
    } catch (e: any) {
      setError(e?.message || e?.toString() || '注册失败')
    } finally {
      setLoading(false)
    }
  })

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom textAlign="center">
          孤狼加速 - 注册
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
            helperText="至少8位"
          />
          <TextField
            fullWidth
            label="确认密码"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            margin="normal"
            disabled={loading}
          />
          <TextField
            fullWidth
            label="邀请码（选填）"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            margin="normal"
            disabled={loading}
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
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : '注册'}
          </Button>

          <Button
            fullWidth
            variant="text"
            sx={{ mt: 1 }}
            onClick={() => navigate('/v2board-login')}
            disabled={loading}
          >
            已有账号？去登录
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
