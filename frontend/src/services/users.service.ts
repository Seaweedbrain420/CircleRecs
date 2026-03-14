import api from './api'
import type { UserProfile } from '@/types/user.types'

export const usersService = {
  async getProfile(username: string): Promise<UserProfile> {
    const { data } = await api.get(`/users/${username}`)
    return data
  },

  async updateMe(payload: { displayName?: string; bio?: string; username?: string }): Promise<UserProfile> {
    const { data } = await api.patch('/users/me', payload)
    return data
  },
}
