import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, Users, Sparkles, BarChart2, Search, LogOut, Home, Sun, Moon, UserCircle } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '@/store'
import { logoutThunk, } from '@/store/slices/authSlice'
import { toggleTheme } from '@/store/slices/uiSlice'
import { cn } from '@/lib/utils'
import styles from './AppLayout.module.scss'

const NAV = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/library', icon: BookOpen, label: 'Library' },
  { to: '/friends', icon: Users, label: 'Friends' },
  { to: '/recommendations', icon: Sparkles, label: 'For You' },
  { to: '/year', icon: BarChart2, label: 'Year' },
]

export default function AppLayout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((s) => s.auth.user)
  const theme = useAppSelector((s) => s.ui.theme)

  const handleLogout = async () => {
    await dispatch(logoutThunk())
    navigate('/login')
  }

  return (
    <div className={styles.root}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        {/* Logo */}
        <div className={styles.logoWrap}>
          <h1 className={styles.logoText}>
            CircleRecs
          </h1>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(styles.navLink, isActive ? styles.navLinkActive : styles.navLinkInactive)
              }
            >
              <Icon className={styles.navIcon} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className={styles.sidebarBottom}>
          {/* User info + profile link */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(styles.profileLink, isActive ? styles.profileLinkActive : styles.profileLinkInactive)
            }
          >
            <div className={styles.avatar}>
              {user?.displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.displayName}</p>
              <p className={styles.userHandle}>@{user?.username}</p>
            </div>
            <UserCircle className={styles.profileIcon} />
          </NavLink>

          {/* Theme toggle + Sign out */}
          <div className={styles.actionRow}>
            <button
              onClick={() => dispatch(toggleTheme())}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className={styles.actionBtn}
            >
              {theme === 'dark' ? (
                <Sun className={styles.actionIcon} />
              ) : (
                <Moon className={styles.actionIcon} />
              )}
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={handleLogout}
              title="Sign out"
              className={cn(styles.actionBtn, styles.actionBtnNoFlex)}
            >
              <LogOut className={styles.actionIcon} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
