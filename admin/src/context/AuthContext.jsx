import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getMe, login as loginRequest, logout as logoutRequest } from '../api/client'
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

  const login = useCallback(async (email, password) => {
    const response = await loginRequest(email, password)
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
      login,
      logout,
      refreshAuth,
    }),
    [admin, loading, hasPermission, hasAnyPermission, login, logout, refreshAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
