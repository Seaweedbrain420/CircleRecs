import type { UserProfile } from './user.types'

export interface FriendRequest {
  id: string
  senderId: string
  receiverId: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
  sender: Pick<UserProfile, 'id' | 'username' | 'displayName' | 'avatarUrl'>
}

export interface Friendship {
  friendshipId: string
  since: string
  friend: Pick<UserProfile, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'bio'>
}

export type UserSearchResult = Pick<UserProfile, 'id' | 'username' | 'displayName' | 'avatarUrl' | 'bio'>
