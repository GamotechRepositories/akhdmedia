import axios from 'axios'

const reportXHRProgress = (event, file, onProgress, tracker) => {
  if (!onProgress) return
  const total = event.lengthComputable ? event.total : file.size
  if (!total) return

  const now = Date.now()
  const elapsed = (now - tracker.lastTime) / 1000
  const delta = event.loaded - tracker.lastLoaded
  let speedBps = tracker.speedBps

  if (elapsed >= 0.25 && delta >= 0) {
    speedBps = delta / elapsed
    tracker.lastLoaded = event.loaded
    tracker.lastTime = now
    tracker.speedBps = speedBps
  }

  onProgress({
    percent: Math.min(99, Math.round((event.loaded * 100) / total)),
    loaded: event.loaded,
    total,
    speedBps,
  })
}

const createProgressTracker = () => ({
  lastLoaded: 0,
  lastTime: Date.now(),
  speedBps: 0,
})

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

export const fetchActors = () => api.get('/admin/actors')

export const fetchActor = (id) => api.get(`/admin/actors/${id}`)

export const createActor = (payload) => api.post('/admin/actors', payload)

export const updateActor = (id, payload) => api.put(`/admin/actors/${id}`, payload)

export const deleteActor = (id) => api.delete(`/admin/actors/${id}`)

export const fetchProducts = (admin = true) =>
  api.get('/products', { params: { admin: admin ? 'true' : 'false' } })

export const fetchProduct = (id) =>
  api.get(`/products/${id}`, { params: { admin: 'true' } })

export const reserveClipId = async () => {
  const { data } = await api.get('/products/reserve-clip-id')
  return data
}

const uploadMediaViaProxy = (file, type, onProgress, options = {}) => {
  const tracker = createProgressTracker()
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  if (options.clipId) formData.append('clipId', options.clipId)
  if (options.categorySlug) formData.append('categorySlug', options.categorySlug)
  if (options.actorSlug) formData.append('actorSlug', options.actorSlug)
  if (options.previewIndex) formData.append('previewIndex', String(options.previewIndex))
  if (options.tier) formData.append('tier', options.tier)
  return api.post('/upload', formData, {
    params: { type },
    onUploadProgress: (event) => {
      reportXHRProgress(event, file, onProgress, tracker)
    },
  })
}

const uploadFileToS3Post = (uploadUrl, fields, file, onProgress) =>
  new Promise((resolve, reject) => {
    const tracker = createProgressTracker()
    const formData = new FormData()
    Object.entries(fields || {}).forEach(([key, value]) => {
      formData.append(key, value)
    })
    formData.append('file', file)

    const xhr = new XMLHttpRequest()
    xhr.open('POST', uploadUrl)

    xhr.upload.onprogress = (event) => {
      reportXHRProgress(event, file, onProgress, tracker)
    }

    xhr.onload = () => {
      if (xhr.status === 204 || (xhr.status >= 200 && xhr.status < 300)) {
        resolve()
        return
      }
      reject(new Error(`S3 upload failed (${xhr.status})`))
    }

    xhr.onerror = () => {
      reject(
        new Error(
          `Direct S3 upload failed. Add CORS on your S3 bucket for ${window.location.origin} with POST and PUT allowed.`,
        ),
      )
    }

    xhr.send(formData)
  })

const uploadFileToS3 = (uploadUrl, file, headers, onProgress) =>
  new Promise((resolve, reject) => {
    const tracker = createProgressTracker()
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', uploadUrl)

    Object.entries(headers || {}).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value)
    })

    xhr.upload.onprogress = (event) => {
      reportXHRProgress(event, file, onProgress, tracker)
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }
      reject(new Error(`S3 upload failed (${xhr.status})`))
    }

    xhr.onerror = () => {
      reject(
        new Error(
          `Direct S3 upload failed. Add CORS on your S3 bucket for ${window.location.origin} with PUT allowed.`,
        ),
      )
    }

    xhr.send(file)
  })

const uploadMediaViaS3 = async (file, type, onProgress, options = {}) => {
  const { data: presign } = await api.post('/upload/presign', {
    type,
    filename: file.name,
    contentType: file.type || 'application/octet-stream',
    size: file.size,
    clipId: options.clipId,
    categorySlug: options.categorySlug,
    actorSlug: options.actorSlug,
    previewIndex: options.previewIndex,
    tier: options.tier,
  })

  if (presign.method === 'proxy') {
    return uploadMediaViaProxy(file, type, onProgress, options)
  }

  try {
    if (presign.uploadFields) {
      await uploadFileToS3Post(presign.uploadUrl, presign.uploadFields, file, onProgress)
    } else {
      await uploadFileToS3(presign.uploadUrl, file, presign.headers, onProgress)
    }
  } catch (error) {
    throw error instanceof Error ? error : new Error('S3 upload failed')
  }

  return {
    data: {
      key: presign.key,
      filename: presign.filename,
      size: file.size,
      type,
      url: presign.url,
    },
  }
}

export const uploadMedia = (file, type, onProgress, options = {}) =>
  uploadMediaViaS3(file, type, onProgress, options)

export const createProduct = (payload) => api.post('/products', payload)

export const updateProduct = (id, payload) => api.put(`/products/${id}`, payload)

export const deleteProduct = (id) => api.delete(`/products/${id}`)

export const fetchOrders = () => api.get('/admin/orders')

export const fetchOrder = (id) => api.get(`/admin/orders/${id}`)

export const fetchTransactions = () => api.get('/admin/transactions')

export const fetchTransaction = (id) => api.get(`/admin/transactions/${id}`)

export const fetchSupportRequests = () => api.get('/admin/support')

export const fetchSupportRequest = (id) => api.get(`/admin/support/${id}`)

export const updateSupportRequest = (id, payload) => api.patch(`/admin/support/${id}`, payload)

export const fetchUsers = () => api.get('/admin/users')

export const deleteUser = (id) => api.delete(`/admin/users/${id}`)

export const fetchSiteContent = () => api.get('/admin/site-content')

export const updateSiteContent = (payload) => api.put('/admin/site-content', payload)

export default api
