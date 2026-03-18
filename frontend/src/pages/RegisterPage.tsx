import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store'
import { registerThunk } from '@/store/slices/authSlice'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import styles from './RegisterPage.module.scss'

export default function RegisterPage() {
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((state) => state.auth)

  const [form, setForm] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirm: '',
  })
  const [confirmError, setConfirmError] = useState('')

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setConfirmError('Passwords do not match')
      return
    }
    setConfirmError('')
    await dispatch(registerThunk({
      email: form.email,
      username: form.username,
      displayName: form.displayName,
      password: form.password,
    }))
  }

  return (
    <div className={cn('aurora-bg', styles.page)}>
      <div className="aurora-layer aurora-layer-1" />
      <div className="aurora-layer aurora-layer-2" />
      <div className="aurora-layer aurora-layer-3" />

      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>CircleRecs</h1>
          <p className={styles.subtitle}>Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {[
            { id: 'displayName', label: 'Display Name', type: 'text', placeholder: 'Your Name', autoComplete: 'name' },
            { id: 'username', label: 'Username', type: 'text', placeholder: 'unique_handle', autoComplete: 'username' },
            { id: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autoComplete: 'email' },
            { id: 'password', label: 'Password', type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
            { id: 'confirm', label: 'Confirm Password', type: 'password', placeholder: '••••••••', autoComplete: 'new-password' },
          ].map(({ id, label, type, placeholder, autoComplete }) => (
            <div key={id} className={styles.fieldGroup}>
              <label className={styles.label} htmlFor={id}>{label}</label>
              <input
                id={id}
                type={type}
                autoComplete={autoComplete}
                required
                value={form[id as keyof typeof form]}
                onChange={set(id)}
                className={styles.input}
                placeholder={placeholder}
              />
            </div>
          ))}

          {(confirmError || error) && (
            <p className={styles.errorMsg}>
              {confirmError || error}
            </p>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className={cn(styles.submitBtn, isLoading && styles.submitBtnLoading)}
          >
            {isLoading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.footerLink}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
