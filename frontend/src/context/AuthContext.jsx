import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getMe, login as loginRequest, loginWithGoogle as loginWithGoogleRequest, logout as logoutRequest, register as registerRequest, updateProfile as updateProfileRequest } from '../services/authApi'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshAuth = useCallback(async () => {
    try {
      const response = await getMe()
      setUser(response.data?.user || null)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  const login = useCallback(async (email, password) => {
    const response = await loginRequest(email, password)
    setUser(response.data?.user || null)
    return response
  }, [])

  const loginWithGoogle = useCallback(async (credential) => {
    const response = await loginWithGoogleRequest(credential)
    setUser(response.data?.user || null)
    return response
  }, [])

  const register = useCallback(async (name, email, phone, password) => {
    const response = await registerRequest(name, email, phone, password)
    setUser(response.data?.user || null)
    return response
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setUser(null)
    }
  }, [])

  const updateProfile = useCallback(async (name, phone) => {
    const response = await updateProfileRequest(name, phone)
    setUser(response.data?.user || null)
    return response
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      loginWithGoogle,
      register,
      logout,
      updateProfile,
      refreshAuth,
    }),
    [user, loading, login, loginWithGoogle, register, logout, updateProfile, refreshAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
