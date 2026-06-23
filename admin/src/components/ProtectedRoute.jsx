import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from './ui/PageLoader'

const ProtectedRoute = () => {
  const { admin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <PageLoader fullScreen />
  }

  if (!admin) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export default ProtectedRoute
