export type MediaType = 'BOOK' | 'MOVIE' | 'TV_SHOW'
export type EntryStatus = 'WANT' | 'IN_PROGRESS' | 'COMPLETED' | 'DROPPED'

export interface MediaSearchResult {
  externalId: string
  type: MediaType
  title: string
  author?: string
  director?: string
  coverImageUrl?: string
  releaseYear?: number
  genre?: string[]
  synopsis?: string
  externalRating?: number
  totalPages?: number
  totalEpisodes?: number
  totalSeasons?: number
}

export interface MediaEntry {
  id: string
  userId: string
  mediaId: string
  status: EntryStatus
  userRating: number | null
  review: string | null
  startedAt: string | null
  completedAt: string | null
  pagesRead: number | null
  episodesWatched: number | null
  currentSeason: number | null
  createdAt: string
  updatedAt: string
  media: MediaSearchResult
}
