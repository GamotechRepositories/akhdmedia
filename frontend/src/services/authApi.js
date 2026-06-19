import api from '../api/axios'

export const register = async (name, email, phone, password) => {
  const { data } = await api.post('/user/auth/register', { name, email, phone, password })
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

export const getUserOrders = async () => {
  const { data } = await api.get('/user/orders')
  return data
}

export const getUserOrder = async (orderId) => {
  const { data } = await api.get(`/user/orders/${orderId}`)
  return data
}
