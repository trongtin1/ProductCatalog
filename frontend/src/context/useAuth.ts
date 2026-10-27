import { createContext, useContext } from 'react'
import type { LoginForm } from '../models/auth'

export interface AuthContextValue {
  token: string | null
  isAdmin: boolean
  currentUser: string | null
  login: (form: LoginForm) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}

