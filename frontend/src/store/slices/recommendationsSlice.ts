import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { recommendationsService } from '@/services/recommendations.service'
import type { Recommendation } from '@/types/recommendations.types'

interface RecommendationsState {
  items: Recommendation[]
  isLoading: boolean
  isGenerating: boolean
  error: string | null
}

const initialState: RecommendationsState = {
  items: [],
  isLoading: false,
  isGenerating: false,
  error: null,
}

export const fetchRecommendationsThunk = createAsyncThunk(
  'recommendations/fetchAll',
  async () => recommendationsService.getAll(),
)

export const generateRecommendationsThunk = createAsyncThunk(
  'recommendations/generate',
  async (_, { rejectWithValue }) => {
    try {
      return await recommendationsService.generate()
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to generate recommendations')
    }
  },
)

export const dismissRecommendationThunk = createAsyncThunk(
  'recommendations/dismiss',
  async (id: string) => recommendationsService.dismiss(id),
)

export const saveRecommendationThunk = createAsyncThunk(
  'recommendations/save',
  async (id: string) => recommendationsService.save(id),
)

const recommendationsSlice = createSlice({
  name: 'recommendations',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecommendationsThunk.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchRecommendationsThunk.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload
      })
      .addCase(fetchRecommendationsThunk.rejected, (state) => {
        state.isLoading = false
      })

      .addCase(generateRecommendationsThunk.pending, (state) => {
        state.isGenerating = true
        state.error = null
      })
      .addCase(generateRecommendationsThunk.fulfilled, (state, action) => {
        state.isGenerating = false
        state.items = action.payload
      })
      .addCase(generateRecommendationsThunk.rejected, (state, action) => {
        state.isGenerating = false
        state.error = action.payload as string
      })

      .addCase(dismissRecommendationThunk.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r.id !== action.payload.id)
      })

      .addCase(saveRecommendationThunk.fulfilled, (state, action) => {
        const idx = state.items.findIndex((r) => r.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
  },
})

export default recommendationsSlice.reducer
