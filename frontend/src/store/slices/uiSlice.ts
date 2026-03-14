import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { MediaSearchResult } from '@/types/media.types'

interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  addEntryModalOpen: boolean
  selectedMediaForAdd: MediaSearchResult | null
}

const initialState: UIState = {
  theme: 'dark',
  sidebarOpen: true,
  addEntryModalOpen: false,
  selectedMediaForAdd: null,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
    },
    setTheme(state, action: PayloadAction<'light' | 'dark'>) {
      state.theme = action.payload
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen
    },
    openAddEntryModal(state, action: PayloadAction<MediaSearchResult>) {
      state.addEntryModalOpen = true
      state.selectedMediaForAdd = action.payload
    },
    closeAddEntryModal(state) {
      state.addEntryModalOpen = false
      state.selectedMediaForAdd = null
    },
  },
})

export const { toggleTheme, setTheme, toggleSidebar, openAddEntryModal, closeAddEntryModal } =
  uiSlice.actions
export default uiSlice.reducer
