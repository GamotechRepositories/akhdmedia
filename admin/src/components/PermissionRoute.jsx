import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PageLoader from './ui/PageLoader'
import {
  getFirstAllowedPath,
  hasAdminPermission,
  matchRoutePermission,
} from '../constants/adminPermissions'

const PermissionRoute = () => {
  const { admin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <PageLoader minHeight="min-h-[40vh]" />
  }

  const requiredPermission = matchRoutePermission(location.pathname)

  if (!requiredPermission || hasAdminPermission(admin, requiredPermission)) {
    return <Outlet />
  }

  const fallback = getFirstAllowedPath(admin)
  if (fallback !== '/access-denied' && fallback !== location.pathname) {
    return <Navigate to={fallback} replace />
  }

  return <Navigate to="/access-denied" replace state={{ from: location.pathname }} />
}

export default PermissionRoute
