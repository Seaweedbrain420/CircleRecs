import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import authReducer from './slices/authSlice'
import uiReducer from './slices/uiSlice'
import mediaReducer from './slices/mediaSlice'
import friendsReducer from './slices/friendsSlice'
import recommendationsReducer from './slices/recommendationsSlice'
import statsReducer from './slices/statsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    media: mediaReducer,
    friends: friendsReducer,
    recommendations: recommendationsReducer,
    stats: statsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector(selector)
