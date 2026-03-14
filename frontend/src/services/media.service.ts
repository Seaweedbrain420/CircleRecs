import api from './api'
import type { MediaEntry, MediaSearchResult, MediaType, EntryStatus } from '@/types/media.types'

export interface CreateEntryPayload {
  mediaType: MediaType
  externalId: string
  status: EntryStatus
  userRating?: number
  review?: string
  startedAt?: string
  completedAt?: string
  pagesRead?: number
  episodesWatched?: number
  currentSeason?: number
}

export interface UpdateEntryPayload {
  status?: EntryStatus
  userRating?: number
  review?: string
  startedAt?: string
  completedAt?: string
  pagesRead?: number
  episodesWatched?: number
  currentSeason?: number
}

export const mediaService = {
  async search(type: MediaType, query: string): Promise<MediaSearchResult[]> {
    const { data } = await api.get('/media/search', { params: { type, q: query } })
    return data
  },

  async getLibrary(type?: MediaType, status?: EntryStatus): Promise<MediaEntry[]> {
    const { data } = await api.get('/media/library', {
      params: { ...(type && { type }), ...(status && { status }) },
    })
    return data
  },

  async getFriendActivity(): Promise<(MediaEntry & { user: { id: string; username: string; displayName: string; avatarUrl: string | null } })[]> {
    const { data } = await api.get('/media/friends-activity')
    return data
  },

  async addEntry(payload: CreateEntryPayload): Promise<MediaEntry> {
    const { data } = await api.post('/media/entries', payload)
    return data
  },

  async updateEntry(entryId: string, payload: UpdateEntryPayload): Promise<MediaEntry> {
    const { data } = await api.patch(`/media/entries/${entryId}`, payload)
    return data
  },

  async deleteEntry(entryId: string): Promise<void> {
    await api.delete(`/media/entries/${entryId}`)
  },
}
