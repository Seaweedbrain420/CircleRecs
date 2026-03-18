import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { useAppSelector, useAppDispatch } from '@/store'
import { refreshTokenThunk } from '@/store/slices/authSlice'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import SearchPage from '@/pages/SearchPage'
import LibraryPage from '@/pages/LibraryPage'
import FriendsPage from '@/pages/FriendsPage'
import RecommendationsPage from '@/pages/RecommendationsPage'
import DashboardPage from '@/pages/DashboardPage'
import YearInReviewPage from '@/pages/YearInReviewPage'
import ProfilePage from '@/pages/ProfilePage'
import UsernameSetupPage from '@/pages/UsernameSetupPage'
import NotFoundPage from '@/pages/NotFoundPage'

function App() {
  const dispatch = useAppDispatch()
  const { isAuthenticated } = useAppSelector((state) => state.auth)
  const theme = useAppSelector((state) => state.ui.theme)

  useEffect(() => {
    dispatch(refreshTokenThunk())
  }, [dispatch])

  // Apply theme class to <html> so CSS custom properties cascade correctly
  // from the root element (body background, ShadCN vars, --cr-* vars all respond)
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
  }, [theme])

  return (
    <div>
      <Toaster position="bottom-right" theme={theme} richColors />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />} />

          {/* Username setup — protected but no sidebar */}
          <Route element={<ProtectedRoute />}>
            <Route path="/setup-username" element={<UsernameSetupPage />} />
          </Route>

          {/* Protected — wrapped in AppLayout (sidebar) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
              <Route path="/year" element={<YearInReviewPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={isAuthenticated ? <NotFoundPage /> : <Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
