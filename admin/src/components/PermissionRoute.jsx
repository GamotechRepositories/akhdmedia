import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getFirstAllowedPath,
  hasAdminPermission,
  matchRoutePermission,
} from '../constants/adminPermissions'

const PermissionRoute = () => {
  const { admin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
      </div>
    )
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
