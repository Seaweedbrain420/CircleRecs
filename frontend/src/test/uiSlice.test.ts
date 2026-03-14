import { describe, it, expect } from 'vitest'
import reducer, {
  toggleTheme,
  setTheme,
  toggleSidebar,
  openAddEntryModal,
  closeAddEntryModal,
} from '@/store/slices/uiSlice'
import type { MediaSearchResult } from '@/types/media.types'

const mockSearchResult: MediaSearchResult = {
  externalId: 'ext-1',
  type: 'BOOK',
  title: 'A Great Book',
  author: 'Some Author',
  director: null,
  coverImageUrl: null,
  releaseYear: 2023,
}

const initialState = {
  theme: 'dark' as const,
  sidebarOpen: true,
  addEntryModalOpen: false,
  selectedMediaForAdd: null,
}

describe('uiSlice', () => {
  it('returns initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState)
  })

  describe('toggleTheme', () => {
    it('switches dark → light', () => {
      const state = reducer(initialState, toggleTheme())
      expect(state.theme).toBe('light')
    })

    it('switches light → dark', () => {
      const lightState = { ...initialState, theme: 'light' as const }
      const state = reducer(lightState, toggleTheme())
      expect(state.theme).toBe('dark')
    })
  })

  describe('setTheme', () => {
    it('sets theme to light directly', () => {
      const state = reducer(initialState, setTheme('light'))
      expect(state.theme).toBe('light')
    })

    it('sets theme to dark directly', () => {
      const lightState = { ...initialState, theme: 'light' as const }
      const state = reducer(lightState, setTheme('dark'))
      expect(state.theme).toBe('dark')
    })
  })

  describe('toggleSidebar', () => {
    it('closes an open sidebar', () => {
      const state = reducer(initialState, toggleSidebar())
      expect(state.sidebarOpen).toBe(false)
    })

    it('opens a closed sidebar', () => {
      const closedState = { ...initialState, sidebarOpen: false }
      const state = reducer(closedState, toggleSidebar())
      expect(state.sidebarOpen).toBe(true)
    })
  })

  describe('openAddEntryModal', () => {
    it('opens modal and stores selected media', () => {
      const state = reducer(initialState, openAddEntryModal(mockSearchResult))
      expect(state.addEntryModalOpen).toBe(true)
      expect(state.selectedMediaForAdd).toEqual(mockSearchResult)
    })
  })

  describe('closeAddEntryModal', () => {
    it('closes modal and clears selected media', () => {
      const openState = {
        ...initialState,
        addEntryModalOpen: true,
        selectedMediaForAdd: mockSearchResult,
      }
      const state = reducer(openState, closeAddEntryModal())
      expect(state.addEntryModalOpen).toBe(false)
      expect(state.selectedMediaForAdd).toBeNull()
    })
  })
})
