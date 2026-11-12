import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  getMe,
  logout as logoutRequest,
  requestAdminLoginOtp,
  verifyAdminLoginOtp,
} from '../api/client'
import {
  hasAdminPermission as checkPermission,
  hasAnyAdminPermission as checkAnyPermission,
} from '../constants/adminPermissions'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshAuth = useCallback(async () => {
    try {
      const response = await getMe()
      setAdmin(response.data?.admin || null)
    } catch {
      setAdmin(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  const sendLoginCode = useCallback(async (email) => requestAdminLoginOtp(email), [])

  const verifyLoginCode = useCallback(async (email, code) => {
    const response = await verifyAdminLoginOtp(email, code)
    setAdmin(response.data?.admin || null)
    return response
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setAdmin(null)
    }
  }, [])

  const hasPermission = useCallback(
    (permission) => checkPermission(admin, permission),
    [admin],
  )

  const hasAnyPermission = useCallback(
    (permissions) => checkAnyPermission(admin, permissions),
    [admin],
  )

  const value = useMemo(
    () => ({
      admin,
      loading,
      isAuthenticated: Boolean(admin),
      isSuperAdmin: Boolean(admin?.isSuperAdmin),
      hasPermission,
      hasAnyPermission,
      sendLoginCode,
      verifyLoginCode,
      logout,
      refreshAuth,
    }),
    [admin, loading, hasPermission, hasAnyPermission, sendLoginCode, verifyLoginCode, logout, refreshAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
