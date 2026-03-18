import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import { authService } from '@/services/auth.service'
import type { UserProfile, LoginDto, RegisterDto } from '@/types/user.types'

interface AuthState {
  user: UserProfile | null
  accessToken: string | null
  isAuthenticated: boolean
  isInitializing: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isInitializing: true,
  isLoading: false,
  error: null,
}

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (dto: LoginDto, { rejectWithValue }) => {
    try {
      return await authService.login(dto)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  },
)

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (dto: RegisterDto, { rejectWithValue }) => {
    try {
      return await authService.register(dto)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      return rejectWithValue(error.response?.data?.message || 'Registration failed')
    }
  },
)

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await authService.logout()
})

export const refreshTokenThunk = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    try {
      return await authService.refreshToken()
    } catch {
      return rejectWithValue('Session expired')
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: UserProfile; accessToken: string }>) {
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.isAuthenticated = true
      state.error = null
    },
    setUser(state, action: PayloadAction<UserProfile>) {
      state.user = action.payload
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.isAuthenticated = true
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.accessToken = action.payload.accessToken
        state.isAuthenticated = true
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.isAuthenticated = false
      })
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken
        state.user = action.payload.user
        state.isAuthenticated = true
        state.isInitializing = false
      })
      .addCase(refreshTokenThunk.rejected, (state) => {
        state.user = null
        state.accessToken = null
        state.isAuthenticated = false
        state.isInitializing = false
      })
  },
})

export const { setCredentials, setUser, clearError } = authSlice.actions
export default authSlice.reducer
