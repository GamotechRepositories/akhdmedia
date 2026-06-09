import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong'
    return Promise.reject(new Error(message))
  },
)

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

export const uploadMedia = (file, type) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const createProduct = (payload) => api.post('/products', payload)

export const updateProduct = (id, payload) => api.put(`/products/${id}`, payload)

export const fetchTranscodeStatus = (id) => api.get(`/products/${id}/transcode-status`)

export const retriggerTranscode = (id) => api.post(`/products/${id}/retranscode`)

export const deleteProduct = (id) => api.delete(`/products/${id}`)

export const reseedCatalog = () => api.post('/seed')

export default api
