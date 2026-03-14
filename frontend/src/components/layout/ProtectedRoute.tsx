import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/store'

export default function ProtectedRoute() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth)
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // New Google users must pick a username before accessing the app
  if (user?.needsUsername && location.pathname !== '/setup-username') {
    return <Navigate to="/setup-username" replace />
  }

  return <Outlet />
}
