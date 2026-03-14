import api from './api'
import type { AuthResponse, LoginDto, RegisterDto } from '@/types/user.types'

export const authService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', dto)
    return data
  },

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', dto)
    return data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async refreshToken(): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/refresh')
    return data
  },

  async getMe(): Promise<AuthResponse['user']> {
    const { data } = await api.get('/auth/me')
    return data
  },
}
