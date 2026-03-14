import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { statsService } from '@/services/stats.service'
import type { YearStats, StatsSummary } from '@/types/stats.types'

interface StatsState {
  yearStats: YearStats | null
  summary: StatsSummary | null
  isLoading: boolean
}

const initialState: StatsState = {
  yearStats: null,
  summary: null,
  isLoading: false,
}

export const fetchYearStatsThunk = createAsyncThunk(
  'stats/fetchYear',
  async (year: number) => statsService.getYearStats(year),
)

export const fetchSummaryThunk = createAsyncThunk(
  'stats/fetchSummary',
  async () => statsService.getSummary(),
)

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchYearStatsThunk.pending, (state) => { state.isLoading = true })
      .addCase(fetchYearStatsThunk.fulfilled, (state, action) => {
        state.isLoading = false
        state.yearStats = action.payload
      })
      .addCase(fetchYearStatsThunk.rejected, (state) => { state.isLoading = false })

      .addCase(fetchSummaryThunk.fulfilled, (state, action) => {
        state.summary = action.payload
      })
  },
})

export default statsSlice.reducer
