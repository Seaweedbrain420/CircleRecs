export interface MonthlyEntry {
  month: number
  BOOK: number
  MOVIE: number
  TV_SHOW: number
}

export interface GenreCount {
  genre: string
  count: number
}

export interface YearStats {
  year: number
  total: number
  totals: { BOOK: number; MOVIE: number; TV_SHOW: number }
  monthly: MonthlyEntry[]
  topGenres: GenreCount[]
  avgRating: number | null
}

export interface StatsSummary {
  totalEntries: number
  completedEntries: number
  friendCount: number
}
