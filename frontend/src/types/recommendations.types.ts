import type { MediaType } from './media.types'

export interface Recommendation {
  id: string
  userId: string
  mediaType: MediaType
  title: string
  reason: string
  externalId: string | null
  coverImageUrl: string | null
  generatedAt: string
  dismissed: boolean
  saved: boolean
}
