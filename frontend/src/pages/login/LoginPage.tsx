import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context'
import { useToast } from '../../components/common'
import './LoginPage.css'

export const LoginPage: React.FC = () => {
  const { login, isAdmin } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isAdmin) {
      navigate('/products', { replace: true })
    }
  }, [isAdmin, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) return

    setLoading(true)
    try {
      await login({ username: username.trim(), password })
      toast.success('Đăng nhập thành công!')
      navigate('/products', { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { detail?: string })?.detail ??
        (err as { message?: string })?.message ??
        (err instanceof Error ? err.message : 'Đăng nhập thất bại')
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-card__header">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h1 className="login-card__title">Đăng nhập Admin</h1>
          <p className="login-card__subtitle">Chỉ admin mới có thể thêm / sửa / xóa dữ liệu</p>
        </div>

        <div className="login-card__body">
          <div className="login-field">
            <label htmlFor="username" className="login-field__label">Tên đăng nhập</label>
            <input
              id="username"
              className="login-field__input"
              type="text"
              autoComplete="username"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-field__label">Mật khẩu</label>
            <input
              id="password"
              className="login-field__input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <Link
              to="/products"
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-primary, #3b82f6)',
                textDecoration: 'none',
              }}
            >
              ← Quay lại danh sách sản phẩm
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
