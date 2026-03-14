export interface UserProfile {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  needsUsername: boolean
  createdAt: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface RegisterDto {
  email: string
  username: string
  displayName: string
  password: string
}

export interface AuthResponse {
  user: UserProfile
  accessToken: string
}
