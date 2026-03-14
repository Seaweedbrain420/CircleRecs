import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { mediaService, type CreateEntryPayload, type UpdateEntryPayload } from '@/services/media.service'
import type { MediaEntry, MediaSearchResult, MediaType, EntryStatus } from '@/types/media.types'

interface FriendActivityEntry extends MediaEntry {
  user: { id: string; username: string; displayName: string; avatarUrl: string | null }
}

interface MediaState {
  library: MediaEntry[]
  searchResults: MediaSearchResult[]
  friendActivity: FriendActivityEntry[]
  currentFilter: { type?: MediaType; status?: EntryStatus }
  isLoading: boolean
  isSearching: boolean
  error: string | null
}

const initialState: MediaState = {
  library: [],
  searchResults: [],
  friendActivity: [],
  currentFilter: {},
  isLoading: false,
  isSearching: false,
  error: null,
}

export const fetchLibraryThunk = createAsyncThunk(
  'media/fetchLibrary',
  async (filters: { type?: MediaType; status?: EntryStatus } = {}) => {
    return mediaService.getLibrary(filters.type, filters.status)
  },
)

export const searchMediaThunk = createAsyncThunk(
  'media/search',
  async ({ type, query }: { type: MediaType; query: string }) => {
    return mediaService.search(type, query)
  },
)

export const addEntryThunk = createAsyncThunk(
  'media/addEntry',
  async (payload: CreateEntryPayload, { rejectWithValue }) => {
    try {
      return await mediaService.addEntry(payload)
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add')
    }
  },
)

export const updateEntryThunk = createAsyncThunk(
  'media/updateEntry',
  async ({ entryId, payload }: { entryId: string; payload: UpdateEntryPayload }) => {
    return mediaService.updateEntry(entryId, payload)
  },
)

export const deleteEntryThunk = createAsyncThunk(
  'media/deleteEntry',
  async (entryId: string) => {
    await mediaService.deleteEntry(entryId)
    return entryId
  },
)

export const fetchFriendActivityThunk = createAsyncThunk('media/friendActivity', async () => {
  return mediaService.getFriendActivity()
})

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<{ type?: MediaType; status?: EntryStatus }>) {
      state.currentFilter = action.payload
    },
    clearSearchResults(state) {
      state.searchResults = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLibraryThunk.pending, (state) => { state.isLoading = true })
      .addCase(fetchLibraryThunk.fulfilled, (state, action) => {
        state.isLoading = false
        state.library = action.payload
      })
      .addCase(fetchLibraryThunk.rejected, (state) => { state.isLoading = false })

      .addCase(searchMediaThunk.pending, (state) => { state.isSearching = true })
      .addCase(searchMediaThunk.fulfilled, (state, action) => {
        state.isSearching = false
        state.searchResults = action.payload
      })
      .addCase(searchMediaThunk.rejected, (state) => { state.isSearching = false })

      .addCase(addEntryThunk.fulfilled, (state, action) => {
        state.library.unshift(action.payload)
      })

      .addCase(updateEntryThunk.fulfilled, (state, action) => {
        const idx = state.library.findIndex((e) => e.id === action.payload.id)
        if (idx !== -1) state.library[idx] = action.payload
      })

      .addCase(deleteEntryThunk.fulfilled, (state, action) => {
        state.library = state.library.filter((e) => e.id !== action.payload)
      })

      .addCase(fetchFriendActivityThunk.fulfilled, (state, action) => {
        state.friendActivity = action.payload
      })
  },
})

export const { setFilter, clearSearchResults } = mediaSlice.actions
export default mediaSlice.reducer
