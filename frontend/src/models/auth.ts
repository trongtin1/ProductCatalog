export interface LoginForm {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface UserProfile {
  username: string
  is_admin: boolean
}

