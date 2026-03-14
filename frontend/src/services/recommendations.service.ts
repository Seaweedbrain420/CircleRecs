import api from './api'
import type { Recommendation } from '@/types/recommendations.types'

export const recommendationsService = {
  async getAll(): Promise<Recommendation[]> {
    const { data } = await api.get('/recommendations')
    return data
  },

  async generate(): Promise<Recommendation[]> {
    const { data } = await api.post('/recommendations/generate')
    return data
  },

  async dismiss(id: string): Promise<Recommendation> {
    const { data } = await api.patch(`/recommendations/${id}/dismiss`)
    return data
  },

  async save(id: string): Promise<Recommendation> {
    const { data } = await api.patch(`/recommendations/${id}/save`)
    return data
  },
}
