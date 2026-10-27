import React, { useState, useCallback, useEffect } from 'react'
import { AuthService } from '../services/authApi'
import type { LoginForm } from '../models/auth'
import { AuthContext } from './useAuth'

const TOKEN_KEY = 'admin_token'

function parseJwt(token: string): { sub?: string; exp?: number } | null {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

function getValidToken(): {
  token: string | null
  username: string | null
} {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    return { token: null, username: null }
  }
  const payload = parseJwt(token)
  if (!payload || !payload.exp || payload.exp * 1000 <= Date.now()) {
    localStorage.removeItem(TOKEN_KEY)
    return { token: null, username: null }
  }
  return {
    token,
    username: payload.sub || null,
  }
}

export const AuthProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [authState, setAuthState] = useState(() => getValidToken())

  const login = useCallback(async (form: LoginForm) => {
    const res = await AuthService.login(form)
    localStorage.setItem(TOKEN_KEY, res.access_token)
    const payload = parseJwt(res.access_token)
    setAuthState({
      token: res.access_token,
      username: payload?.sub || form.username,
    })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setAuthState({
      token: null,
      username: null,
    })
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [logout])

  return (
    <AuthContext.Provider
      value={{
        token: authState.token,
        isAdmin: Boolean(authState.token),
        currentUser: authState.username,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

