import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { setUser } from '@/store/slices/authSlice'
import { usersService } from '@/services/users.service'
import { useDebounce } from '@/hooks/useDebounce'
import api from '@/services/api'
import { cn } from '@/lib/utils'
import styles from './UsernameSetupPage.module.scss'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/

export default function UsernameSetupPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)

  const [username, setUsername] = useState('')
  const [isChecking, setIsChecking] = useState(false)
  const [isTaken, setIsTaken] = useState<boolean | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const debouncedUsername = useDebounce(username, 400)

  // Check availability as user types
  useEffect(() => {
    if (!debouncedUsername || !USERNAME_REGEX.test(debouncedUsername)) {
      setIsTaken(null)
      return
    }
    setIsChecking(true)
    api
      .get(`/users/${debouncedUsername}`)
      .then(() => {
        // user found → taken
        setIsTaken(true)
      })
      .catch((err) => {
        // 404 → available
        if (err.response?.status === 404) setIsTaken(false)
        else setIsTaken(null)
      })
      .finally(() => setIsChecking(false))
  }, [debouncedUsername])

  const formatError = () => {
    if (!username) return ''
    if (username.length > 0 && username.length < 3) return 'At least 3 characters'
    if (!USERNAME_REGEX.test(username)) return 'Letters, numbers, and underscores only'
    return ''
  }

  const validFormat = USERNAME_REGEX.test(username)
  const isAvailable = validFormat && isTaken === false
  const canSubmit = isAvailable && !isSaving && !isChecking

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setIsSaving(true)
    try {
      const updated = await usersService.updateMe({ username })
      dispatch(setUser(updated))
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save username')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        {/* Logo */}
        <h1 className={styles.logo}>CircleRecs</h1>
        <p className={styles.welcomeText}>
          Welcome, {user?.displayName?.split(' ')[0]}! Choose a username to get started.
        </p>

        <div className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                Username
              </label>
              <div className={styles.inputWrapper}>
                <span className={styles.inputPrefix}>@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  maxLength={20}
                  placeholder="your_username"
                  autoFocus
                  className={styles.input}
                />
                {/* Status icon */}
                <div className={styles.inputStatus}>
                  {isChecking && (
                    <Loader2 className={cn(styles.statusIcon, styles.statusChecking, 'animate-spin')} />
                  )}
                  {!isChecking && isAvailable && (
                    <CheckCircle className={cn(styles.statusIcon, styles.statusAvailable)} />
                  )}
                  {!isChecking && isTaken === true && (
                    <XCircle className={cn(styles.statusIcon, styles.statusTaken)} />
                  )}
                </div>
              </div>

              {/* Inline feedback */}
              <div className={styles.feedback}>
                {formatError() && (
                  <span className={styles.feedbackError}>{formatError()}</span>
                )}
                {!formatError() && isTaken === true && (
                  <span className={styles.feedbackError}>That username is already taken</span>
                )}
                {!formatError() && isAvailable && (
                  <span className={styles.feedbackSuccess}>@{username} is available!</span>
                )}
              </div>
            </div>

            <p className={styles.hint}>
              3–20 characters · letters, numbers, underscores · can be changed later in Profile settings
            </p>

            {error && (
              <p className={styles.errorMsg}>{error}</p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={styles.submitBtn}
            >
              {isSaving ? 'Setting up…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
