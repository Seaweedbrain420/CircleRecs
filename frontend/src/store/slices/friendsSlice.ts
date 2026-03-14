import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { friendsService } from '@/services/friends.service'
import type { Friendship, FriendRequest, UserSearchResult } from '@/types/friends.types'

interface FriendsState {
  friends: Friendship[]
  pendingRequests: FriendRequest[]
  userSearchResults: UserSearchResult[]
  isLoading: boolean
  isSearching: boolean
  error: string | null
}

const initialState: FriendsState = {
  friends: [],
  pendingRequests: [],
  userSearchResults: [],
  isLoading: false,
  isSearching: false,
  error: null,
}

export const fetchFriendsThunk = createAsyncThunk('friends/fetchAll', async () => {
  const [friends, pendingRequests] = await Promise.all([
    friendsService.getFriends(),
    friendsService.getPendingRequests(),
  ])
  return { friends, pendingRequests }
})

export const searchUsersThunk = createAsyncThunk(
  'friends/searchUsers',
  async (query: string) => friendsService.searchUsers(query),
)

export const sendRequestThunk = createAsyncThunk(
  'friends/sendRequest',
  async (receiverId: string, { rejectWithValue }) => {
    try {
      return await friendsService.sendRequest(receiverId)
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Failed to send request')
    }
  },
)

export const respondRequestThunk = createAsyncThunk(
  'friends/respondRequest',
  async ({ requestId, accept }: { requestId: string; accept: boolean }) => {
    const result = await friendsService.respondToRequest(requestId, accept)
    return { requestId, accepted: result.accepted }
  },
)

export const removeFriendThunk = createAsyncThunk(
  'friends/remove',
  async (friendId: string) => {
    await friendsService.removeFriend(friendId)
    return friendId
  },
)

const friendsSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    clearUserSearch(state) {
      state.userSearchResults = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFriendsThunk.pending, (state) => { state.isLoading = true })
      .addCase(fetchFriendsThunk.fulfilled, (state, action) => {
        state.isLoading = false
        state.friends = action.payload.friends
        state.pendingRequests = action.payload.pendingRequests
      })
      .addCase(fetchFriendsThunk.rejected, (state) => { state.isLoading = false })

      .addCase(searchUsersThunk.pending, (state) => { state.isSearching = true })
      .addCase(searchUsersThunk.fulfilled, (state, action) => {
        state.isSearching = false
        state.userSearchResults = action.payload
      })
      .addCase(searchUsersThunk.rejected, (state) => { state.isSearching = false })

      .addCase(respondRequestThunk.fulfilled, (state, action) => {
        state.pendingRequests = state.pendingRequests.filter(
          (r) => r.id !== action.payload.requestId,
        )
      })

      .addCase(removeFriendThunk.fulfilled, (state, action) => {
        state.friends = state.friends.filter((f) => f.friend.id !== action.payload)
      })
  },
})

export const { clearUserSearch } = friendsSlice.actions
export default friendsSlice.reducer
