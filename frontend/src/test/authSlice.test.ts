import { describe, it, expect } from 'vitest'
import reducer, {
  setCredentials,
  setUser,
  clearError,
  loginThunk,
  logoutThunk,
  refreshTokenThunk,
} from '@/store/slices/authSlice'
import type { UserProfile } from '@/types/user.types'

const mockUser: UserProfile = {
  id: 'user-1',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  bio: null,
  avatarUrl: null,
  needsUsername: false,
  createdAt: '2024-01-01T00:00:00.000Z',
}

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

describe('authSlice reducers', () => {
  it('returns the initial state', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState)
  })

  it('setCredentials sets user, token, and authenticated flag', () => {
    const state = reducer(
      initialState,
      setCredentials({ user: mockUser, accessToken: 'tok-123' }),
    )
    expect(state.user).toEqual(mockUser)
    expect(state.accessToken).toBe('tok-123')
    expect(state.isAuthenticated).toBe(true)
    expect(state.error).toBeNull()
  })

  it('setUser updates only the user field', () => {
    const baseState = {
      ...initialState,
      user: mockUser,
      accessToken: 'tok-123',
      isAuthenticated: true,
    }
    const updatedUser = { ...mockUser, displayName: 'Updated Name' }
    const state = reducer(baseState, setUser(updatedUser))
    expect(state.user?.displayName).toBe('Updated Name')
    expect(state.accessToken).toBe('tok-123')
    expect(state.isAuthenticated).toBe(true)
  })

  it('clearError resets the error field', () => {
    const errorState = { ...initialState, error: 'Some error' }
    const state = reducer(errorState, clearError())
    expect(state.error).toBeNull()
  })
})

describe('authSlice loginThunk', () => {
  it('sets isLoading=true on pending', () => {
    const state = reducer(initialState, loginThunk.pending('', { email: '', password: '' }))
    expect(state.isLoading).toBe(true)
    expect(state.error).toBeNull()
  })

  it('sets user + token on fulfilled', () => {
    const payload = { user: mockUser, accessToken: 'tok-abc' }
    const state = reducer(initialState, loginThunk.fulfilled(payload, '', { email: '', password: '' }))
    expect(state.isLoading).toBe(false)
    expect(state.user).toEqual(mockUser)
    expect(state.accessToken).toBe('tok-abc')
    expect(state.isAuthenticated).toBe(true)
  })

  it('sets error on rejected', () => {
    const action = loginThunk.rejected(null, '', { email: '', password: '' }, 'Invalid credentials')
    const state = reducer(initialState, action)
    expect(state.isLoading).toBe(false)
    expect(state.error).toBe('Invalid credentials')
    expect(state.isAuthenticated).toBe(false)
  })
})

describe('authSlice logoutThunk', () => {
  it('clears user, token, and authenticated on fulfilled', () => {
    const loggedInState = {
      user: mockUser,
      accessToken: 'tok-123',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }
    const state = reducer(loggedInState, logoutThunk.fulfilled(undefined, ''))
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})

describe('authSlice refreshTokenThunk', () => {
  it('updates token + user on fulfilled', () => {
    const payload = { user: mockUser, accessToken: 'refreshed-tok' }
    const state = reducer(initialState, refreshTokenThunk.fulfilled(payload, ''))
    expect(state.accessToken).toBe('refreshed-tok')
    expect(state.user).toEqual(mockUser)
    expect(state.isAuthenticated).toBe(true)
  })

  it('clears auth state on rejected', () => {
    const loggedInState = {
      user: mockUser,
      accessToken: 'tok-123',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    }
    const state = reducer(loggedInState, refreshTokenThunk.rejected(null, ''))
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })
})
