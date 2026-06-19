import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password'])
const PROTECTED_PATHS = new Set(['/profile', '/orders'])

export const getAuthClosePath = (location, fallback = '/') => {
  const from = location.state?.from

  if (typeof from === 'string' && from.trim()) {
    const path = from.split('?')[0]
    if (!AUTH_PATHS.has(path) && !PROTECTED_PATHS.has(path)) {
      return from
    }
  }

  return fallback
}

export const useCloseAuthModal = (fallback = '/') => {
  const navigate = useNavigate()
  const location = useLocation()

  return useCallback(() => {
    navigate(getAuthClosePath(location, fallback), { replace: true })
  }, [fallback, location, navigate])
}
