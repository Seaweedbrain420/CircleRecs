import { useEffect, useState } from 'react'
import { Search, UserPlus, UserCheck, UserX, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  fetchFriendsThunk,
  searchUsersThunk,
  sendRequestThunk,
  respondRequestThunk,
  removeFriendThunk,
  clearUserSearch,
} from '@/store/slices/friendsSlice'
import { useDebounce } from '@/hooks/useDebounce'
import styles from './FriendsPage.module.scss'

export default function FriendsPage() {
  const dispatch = useAppDispatch()
  const { friends, pendingRequests, userSearchResults, isLoading, isSearching } =
    useAppSelector((s) => s.friends)

  const [query, setQuery] = useState('')
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    dispatch(fetchFriendsThunk())
  }, [dispatch])

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      dispatch(clearUserSearch())
      return
    }
    dispatch(searchUsersThunk(debouncedQuery.trim()))
  }, [debouncedQuery, dispatch])

  const handleSendRequest = async (receiverId: string) => {
    const result = await dispatch(sendRequestThunk(receiverId))
    if (sendRequestThunk.fulfilled.match(result)) {
      setSentIds((prev) => new Set(prev).add(receiverId))
      toast.success('Friend request sent')
    } else {
      toast.error('Could not send request')
    }
  }

  const handleRespond = async (requestId: string, accept: boolean) => {
    await dispatch(respondRequestThunk({ requestId, accept }))
    if (accept) {
      dispatch(fetchFriendsThunk())
      toast.success('Friend request accepted')
    } else {
      toast('Request declined')
    }
  }

  const handleRemove = async (friendId: string) => {
    await dispatch(removeFriendThunk(friendId))
    toast('Friend removed')
  }

  const friendIds = new Set(friends.map((f) => f.friend.id))
  const pendingReceiverIds = new Set(pendingRequests.map((r) => r.senderId))

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Friends</h1>

      {/* Search */}
      <div className={styles.searchWrapper}>
        <Search className={styles.searchIcon} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username…"
          className={styles.searchInput}
        />
        {isSearching && (
          <Loader2 className={styles.searchSpinner} />
        )}
      </div>

      {/* Search results */}
      {debouncedQuery.trim().length >= 2 && userSearchResults.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Search Results</h2>
          <div className={styles.list}>
            {userSearchResults.map((user) => {
              const isFriend = friendIds.has(user.id)
              const hasPending = pendingReceiverIds.has(user.id)
              const isSent = sentIds.has(user.id)

              return (
                <div key={user.id} className={styles.row}>
                  <div className={`${styles.avatar} ${styles.avatarIndigo}`}>
                    {user.displayName?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className={styles.userInfo}>
                    <p className={styles.userName}>{user.displayName}</p>
                    <p className={styles.userHandle}>@{user.username}</p>
                  </div>
                  {isFriend ? (
                    <span className={styles.friendsBadge}>
                      <UserCheck className={styles.friendsBadgeIcon} />
                      Friends
                    </span>
                  ) : isSent ? (
                    <span className={styles.sentBadge}>Request sent</span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      className={styles.btnAdd}
                    >
                      <UserPlus className={styles.btnIcon} />
                      Add
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {debouncedQuery.trim().length >= 2 && !isSearching && userSearchResults.length === 0 && (
        <p className={styles.noResults}>No users found</p>
      )}

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>
            Friend Requests ({pendingRequests.length})
          </h2>
          <div className={styles.list}>
            {pendingRequests.map((req) => (
              <div key={req.id} className={styles.row}>
                <div className={`${styles.avatar} ${styles.avatarViolet}`}>
                  {req.sender.displayName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className={styles.userInfo}>
                  <p className={styles.userName}>{req.sender.displayName}</p>
                  <p className={styles.userHandle}>@{req.sender.username}</p>
                </div>
                <div className={styles.btnGroup}>
                  <button
                    onClick={() => handleRespond(req.id, true)}
                    className={styles.btnAccept}
                  >
                    <UserCheck className={styles.btnIcon} />
                    Accept
                  </button>
                  <button
                    onClick={() => handleRespond(req.id, false)}
                    className={styles.btnDecline}
                  >
                    <UserX className={styles.btnIcon} />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Friends list */}
      <section>
        <h2 className={styles.sectionHeading}>
          My Friends {friends.length > 0 && `(${friends.length})`}
        </h2>

        {isLoading ? (
          <div className={styles.skeleton}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div className={styles.empty}>
            <Users className={styles.emptyIcon} />
            <p className={styles.emptyText}>No friends yet.</p>
            <p className={styles.emptySubtext}>Search for users above to connect.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {friends.map(({ friendshipId, friend, since }) => (
              <div key={friendshipId} className={styles.row}>
                <div className={`${styles.avatar} ${styles.avatarIndigo}`}>
                  {friend.displayName?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div className={styles.userInfo}>
                  <p className={styles.userName}>{friend.displayName}</p>
                  <p className={styles.userHandle}>@{friend.username}</p>
                </div>
                <div className={styles.friendMeta}>
                  <span className={styles.sinceBadge}>
                    since {new Date(since).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleRemove(friend.id)}
                    className={styles.btnRemove}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
