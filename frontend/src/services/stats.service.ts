import api from './api'
import type { YearStats, StatsSummary } from '@/types/stats.types'

export const statsService = {
  async getYearStats(year: number): Promise<YearStats> {
    const { data } = await api.get(`/stats/year/${year}`)
    return data
  },

  async getSummary(): Promise<StatsSummary> {
    const { data } = await api.get('/stats/summary')
    return data
  },
}
