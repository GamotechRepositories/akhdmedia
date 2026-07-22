import api from '../api/axios'

export const register = async (name, email, phone, password) => {
  const { data } = await api.post('/user/auth/register', { name, email, phone, password })
  return data
}

export const sendRegisterOtp = async (name, email, phone, password) => {
  const { data } = await api.post('/user/auth/register/send-otp', {
    name,
    email,
    phone,
    password,
  })
  return data
}

export const resendRegisterOtp = async (email) => {
  const { data } = await api.post('/user/auth/register/resend-otp', { email })
  return data
}

export const verifyRegisterOtp = async (email, code) => {
  const { data } = await api.post('/user/auth/register/verify-otp', { email, code })
  return data
}

export const login = async (email, password) => {
  const { data } = await api.post('/user/auth/login', { email, password })
  return data
}

export const loginWithGoogle = async (credential) => {
  const { data } = await api.post('/user/auth/google', { credential })
  return data
}

export const requestPasswordReset = async (email) => {
  const { data } = await api.post('/user/auth/forgot-password', { email })
  return data
}

export const resendPasswordResetOtp = async (email) => {
  const { data } = await api.post('/user/auth/forgot-password/resend-otp', { email })
  return data
}

export const resetPassword = async (email, code, password) => {
  const { data } = await api.post('/user/auth/reset-password', { email, code, password })
  return data
}

export const logout = async () => {
  const { data } = await api.post('/user/auth/logout')
  return data
}

export const getMe = async () => {
  const { data } = await api.get('/user/auth/me')
  return data
}

export const updateProfile = async (name, phone) => {
  const { data } = await api.patch('/user/auth/profile', { name, phone })
  return data
}

export const requestDeleteAccount = async (reason) => {
  const { data } = await api.post('/user/auth/delete-account/request', { reason })
  return data
}

export const confirmDeleteAccount = async (code) => {
  const { data } = await api.post('/user/auth/delete-account/confirm', { code })
  return data
}

export const getUserOrders = async () => {
  const { data } = await api.get('/user/orders')
  return data
}

export const getUserOrder = async (orderId) => {
  const { data } = await api.get(`/user/orders/${orderId}`)
  return data
}
