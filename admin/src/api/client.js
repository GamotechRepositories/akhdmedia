import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    if (config.headers) {
      delete config.headers['Content-Type']
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong'

    const requestUrl = error.config?.url || ''
    const isAuthCheck = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/me')

    if (
      error.response?.status === 401 &&
      !isAuthCheck &&
      !window.location.pathname.startsWith('/login')
    ) {
      window.location.href = '/login'
    }

    return Promise.reject(new Error(message))
  },
)

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export const logout = async () => {
  const { data } = await api.post('/auth/logout')
  return data
}

export const getMe = async () => {
  const { data } = await api.get('/auth/me')
  return data
}

export const fetchCategories = (admin = true) =>
  api.get('/categories', { params: { admin: admin ? 'true' : 'false' } })

export const fetchCategory = (id) => api.get(`/categories/${id}`)

export const createCategory = (payload) => api.post('/categories', payload)

export const updateCategory = (id, payload) => api.put(`/categories/${id}`, payload)

export const deleteCategory = (id) => api.delete(`/categories/${id}`)

export const fetchProducts = (admin = true) =>
  api.get('/products', { params: { admin: admin ? 'true' : 'false' } })

export const fetchProduct = (id) =>
  api.get(`/products/${id}`, { params: { admin: 'true' } })

export const uploadMedia = (file, type, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  return api.post('/upload', formData, {
    params: { type },
    onUploadProgress: (event) => {
      if (!onProgress) return
      const total = event.total || file.size
      if (!total) return
      const percent = Math.round((event.loaded * 100) / total)
      onProgress(Math.min(99, percent))
    },
  })
}

export const createProduct = (payload) => api.post('/products', payload)

export const updateProduct = (id, payload) => api.put(`/products/${id}`, payload)

export const deleteProduct = (id) => api.delete(`/products/${id}`)

export const fetchOrders = () => api.get('/admin/orders')

export const fetchOrder = (id) => api.get(`/admin/orders/${id}`)

export const fetchTransactions = () => api.get('/admin/transactions')

export const fetchTransaction = (id) => api.get(`/admin/transactions/${id}`)

export const reseedCatalog = () => api.post('/seed')

export default api
