import api from './api'
import type { Friendship, FriendRequest, UserSearchResult } from '@/types/friends.types'

export const friendsService = {
  async getFriends(): Promise<Friendship[]> {
    const { data } = await api.get('/friends')
    return data
  },

  async getPendingRequests(): Promise<FriendRequest[]> {
    const { data } = await api.get('/friends/requests')
    return data
  },

  async searchUsers(query: string): Promise<UserSearchResult[]> {
    const { data } = await api.get('/friends/search', { params: { q: query } })
    return data
  },

  async sendRequest(receiverId: string): Promise<FriendRequest> {
    const { data } = await api.post('/friends/requests', { receiverId })
    return data
  },

  async respondToRequest(requestId: string, accept: boolean): Promise<{ accepted: boolean }> {
    const { data } = await api.patch(`/friends/requests/${requestId}`, { accept })
    return data
  },

  async removeFriend(friendId: string): Promise<void> {
    await api.delete(`/friends/${friendId}`)
  },
}
