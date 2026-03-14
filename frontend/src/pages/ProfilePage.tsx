import { useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/store'
import { setUser } from '@/store/slices/authSlice'
import { usersService } from '@/services/users.service'
import styles from './ProfilePage.module.scss'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

export default function ProfilePage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const usernameError =
    username !== user?.username && username && !USERNAME_REGEX.test(username)
      ? 'Username must be 3–20 characters: letters, numbers, underscores only'
      : ''

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty')
      return
    }
    if (usernameError) {
      toast.error(usernameError)
      return
    }
    setIsSaving(true)
    try {
      const payload: { displayName?: string; bio?: string; username?: string } = {
        displayName: displayName.trim(),
        bio: bio.trim() || '',
      }
      if (username.trim() && username !== user?.username) {
        payload.username = username.trim()
      }
      const updated = await usersService.updateMe(payload)
      dispatch(setUser(updated))
      toast.success('Profile updated')
      setEditing(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setDisplayName(user?.displayName ?? '')
    setBio(user?.bio ?? '')
    setUsername(user?.username ?? '')
    setEditing(false)
  }

  if (!user) return null

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Profile</h1>

      <div className={styles.card}>
        {/* Avatar */}
        <div className={styles.avatarRow}>
          <div className={styles.avatar}>
            {user.displayName?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className={styles.avatarName}>{user.displayName}</p>
            <p className={styles.avatarHandle}>@{user.username}</p>
          </div>
        </div>

        {editing ? (
          <div className={styles.editForm}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className={styles.input}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Username</label>
              <div className={styles.usernameWrapper}>
                <span className={styles.usernamePrefix}>@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  maxLength={20}
                  className={styles.inputUsername}
                />
              </div>
              {usernameError && (
                <p className={styles.fieldError}>{usernameError}</p>
              )}
              <p className={styles.fieldHint}>
                3–20 chars · letters, numbers, underscores
              </p>
            </div>

            <div className={styles.formField}>
              <label className={styles.formLabel}>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                placeholder="Tell your circle a little about yourself…"
                className={styles.textarea}
              />
              <p className={styles.charCount}>{bio.length}/200</p>
            </div>

            <div className={styles.formActions}>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={styles.btnSave}
              >
                <Check className={styles.btnIcon} />
                {isSaving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className={styles.btnCancel}
              >
                <X className={styles.btnIcon} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.fieldList}>
            <div>
              <p className={styles.fieldLabel}>Email</p>
              <p className={styles.fieldValue}>{user.email}</p>
            </div>
            <div>
              <p className={styles.fieldLabel}>Username</p>
              <p className={styles.fieldValue}>@{user.username}</p>
            </div>
            <div>
              <p className={styles.fieldLabel}>Bio</p>
              <p className={styles.fieldValue}>
                {user.bio || <span className={styles.fieldValueMuted}>No bio yet</span>}
              </p>
            </div>
            <div>
              <p className={styles.fieldLabel}>Member since</p>
              <p className={styles.fieldValue}>
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <button
              onClick={() => setEditing(true)}
              className={styles.btnEdit}
            >
              <Pencil className={styles.btnIcon} />
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
