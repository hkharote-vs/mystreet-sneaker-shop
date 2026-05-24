import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/auth.store'

interface Props {
  adminOnly?: boolean
}

export function ProtectedRoute({ adminOnly = false }: Props) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !user?.isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
