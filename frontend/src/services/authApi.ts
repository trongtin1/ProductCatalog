import axios from 'axios'
import instance from './axios'
import type { LoginForm, TokenResponse, UserProfile } from '../models/auth'
import type { Result } from '../models/result'

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : 'http://localhost:8000/api/v1')

const authInstance = axios.create({ baseURL: rawBaseUrl, timeout: 10000 })

authInstance.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err.response?.data ?? err),
)

export const AuthService = {
  login: (data: LoginForm): Promise<TokenResponse> =>
    authInstance.post('/auth/login', data),
  getMe: (): Promise<Result<UserProfile>> =>
    instance.get('/auth/me'),
}

