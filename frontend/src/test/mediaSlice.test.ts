import { describe, it, expect } from 'vitest'
import reducer, {
  setFilter,
  clearSearchResults,
  fetchLibraryThunk,
  searchMediaThunk,
  addEntryThunk,
  updateEntryThunk,
  deleteEntryThunk,
  fetchFriendActivityThunk,
} from '@/store/slices/mediaSlice'
import type { MediaEntry, MediaSearchResult } from '@/types/media.types'

const mockMedia = {
  id: 'media-1',
  type: 'BOOK' as const,
  title: 'Test Book',
  externalId: 'ext-1',
  author: 'Author Name',
  director: null,
  coverImageUrl: null,
  releaseYear: 2023,
  genre: ['Fiction'],
}

const mockEntry: MediaEntry = {
  id: 'entry-1',
  mediaId: 'media-1',
  userId: 'user-1',
  status: 'WANT',
  userRating: null,
  pagesRead: null,
  episodesWatched: null,
  currentSeason: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  media: mockMedia,
}

const mockSearchResult: MediaSearchResult = {
  externalId: 'ext-2',
  type: 'BOOK',
  title: 'Search Result Book',
  author: 'Search Author',
  director: null,
  coverImageUrl: null,
  releaseYear: 2022,
}

const initialState = {
  library: [],
  searchResults: [],
  friendActivity: [],
  currentFilter: {},
  isLoading: false,
  isSearching: false,
  error: null,
}

describe('mediaSlice reducers', () => {
  it('returns initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState)
  })

  it('setFilter updates currentFilter', () => {
    const state = reducer(initialState, setFilter({ type: 'BOOK', status: 'IN_PROGRESS' }))
    expect(state.currentFilter).toEqual({ type: 'BOOK', status: 'IN_PROGRESS' })
  })

  it('setFilter with partial filter', () => {
    const state = reducer(initialState, setFilter({ type: 'MOVIE' }))
    expect(state.currentFilter.type).toBe('MOVIE')
    expect(state.currentFilter.status).toBeUndefined()
  })

  it('clearSearchResults empties searchResults array', () => {
    const stateWithResults = { ...initialState, searchResults: [mockSearchResult] }
    const state = reducer(stateWithResults, clearSearchResults())
    expect(state.searchResults).toHaveLength(0)
  })
})

describe('mediaSlice fetchLibraryThunk', () => {
  it('sets isLoading=true on pending', () => {
    const state = reducer(initialState, fetchLibraryThunk.pending('', {}))
    expect(state.isLoading).toBe(true)
  })

  it('populates library on fulfilled', () => {
    const state = reducer(
      initialState,
      fetchLibraryThunk.fulfilled([mockEntry], '', {}),
    )
    expect(state.isLoading).toBe(false)
    expect(state.library).toHaveLength(1)
    expect(state.library[0].id).toBe('entry-1')
  })

  it('sets isLoading=false on rejected', () => {
    const loadingState = { ...initialState, isLoading: true }
    const state = reducer(loadingState, fetchLibraryThunk.rejected(null, '', {}))
    expect(state.isLoading).toBe(false)
  })
})

describe('mediaSlice searchMediaThunk', () => {
  it('sets isSearching=true on pending', () => {
    const state = reducer(
      initialState,
      searchMediaThunk.pending('', { type: 'BOOK', query: 'test' }),
    )
    expect(state.isSearching).toBe(true)
  })

  it('populates searchResults on fulfilled', () => {
    const state = reducer(
      initialState,
      searchMediaThunk.fulfilled([mockSearchResult], '', { type: 'BOOK', query: 'test' }),
    )
    expect(state.isSearching).toBe(false)
    expect(state.searchResults).toHaveLength(1)
    expect(state.searchResults[0].title).toBe('Search Result Book')
  })
})

describe('mediaSlice addEntryThunk', () => {
  it('prepends new entry to library on fulfilled', () => {
    const stateWithEntry = { ...initialState, library: [mockEntry] }
    const newEntry: MediaEntry = { ...mockEntry, id: 'entry-2', status: 'IN_PROGRESS' }
    const payload = { mediaType: 'BOOK' as const, externalId: 'ext-2', status: 'IN_PROGRESS' as const }
    const state = reducer(stateWithEntry, addEntryThunk.fulfilled(newEntry, '', payload))
    expect(state.library).toHaveLength(2)
    expect(state.library[0].id).toBe('entry-2') // prepended
  })
})

describe('mediaSlice updateEntryThunk', () => {
  it('updates matching entry in library on fulfilled', () => {
    const stateWithEntry = { ...initialState, library: [mockEntry] }
    const updatedEntry: MediaEntry = { ...mockEntry, status: 'COMPLETED', userRating: 9 }
    const state = reducer(
      stateWithEntry,
      updateEntryThunk.fulfilled(updatedEntry, '', { entryId: 'entry-1', payload: { status: 'COMPLETED' } }),
    )
    expect(state.library[0].status).toBe('COMPLETED')
    expect(state.library[0].userRating).toBe(9)
  })

  it('does not mutate library if entry not found', () => {
    const stateWithEntry = { ...initialState, library: [mockEntry] }
    const nonExistentEntry: MediaEntry = { ...mockEntry, id: 'entry-999', status: 'DROPPED' }
    const state = reducer(
      stateWithEntry,
      updateEntryThunk.fulfilled(nonExistentEntry, '', { entryId: 'entry-999', payload: { status: 'DROPPED' } }),
    )
    expect(state.library[0].status).toBe('WANT') // unchanged
  })
})

describe('mediaSlice deleteEntryThunk', () => {
  it('removes deleted entry from library on fulfilled', () => {
    const secondEntry: MediaEntry = { ...mockEntry, id: 'entry-2' }
    const stateWithEntries = { ...initialState, library: [mockEntry, secondEntry] }
    const state = reducer(
      stateWithEntries,
      deleteEntryThunk.fulfilled('entry-1', '', 'entry-1'),
    )
    expect(state.library).toHaveLength(1)
    expect(state.library[0].id).toBe('entry-2')
  })
})

describe('mediaSlice fetchFriendActivityThunk', () => {
  it('populates friendActivity on fulfilled', () => {
    const friendEntry = { ...mockEntry, user: { id: 'user-2', username: 'friend', displayName: 'Friend', avatarUrl: null } }
    const state = reducer(
      initialState,
      fetchFriendActivityThunk.fulfilled([friendEntry], ''),
    )
    expect(state.friendActivity).toHaveLength(1)
  })
})
