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

    if (
      error.response?.status === 403 &&
      !window.location.pathname.startsWith('/access-denied')
    ) {
      // Let the current page handle permission errors — avoid trapping users on /access-denied
      console.warn('API permission denied:', requestUrl, message)
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

export const fetchHomeCategoryPins = () => api.get('/categories/home-pins')

export const updateCategoryHomePins = (categoryId, productIds) =>
  api.put(`/categories/${categoryId}/home-pins`, { productIds })

export const updateHomeLatestPins = (productIds) =>
  api.put('/admin/site-content/home-latest-pins', { productIds })

export const fetchActors = () => api.get('/admin/actors')

export const fetchAdminActors = ({ page = 1, limit = 50, search = '' } = {}) =>
  api.get('/admin/actors', {
    params: {
      page,
      limit,
      ...(search.trim() ? { search: search.trim() } : {}),
    },
  })

export const fetchPublicActors = () => api.get('/actors')

export const fetchActor = (id) => api.get(`/admin/actors/${id}`)

export const createActor = (payload) => api.post('/admin/actors', payload)

export const updateActor = (id, payload) => api.put(`/admin/actors/${id}`, payload)

export const deleteActor = (id) => api.delete(`/admin/actors/${id}`)

export const fetchProducts = (admin = true) =>
  api.get('/products', { params: { admin: admin ? 'true' : 'false' } })

export const fetchAdminProducts = ({
  page = 1,
  limit = 50,
  search = '',
  mediaType = 'all',
  categorySlug = 'all',
  status = 'all',
  showInLatest = false,
} = {}) =>
  api.get('/products', {
    params: {
      admin: 'true',
      page,
      limit,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(mediaType !== 'all' ? { mediaType } : {}),
      ...(categorySlug !== 'all' ? { categorySlug } : {}),
      ...(status !== 'all' ? { status } : {}),
      ...(showInLatest ? { showInLatest: 'true' } : {}),
    },
  })

export const fetchProduct = (id) =>
  api.get(`/products/${id}`, { params: { admin: 'true' } })

export const reserveClipId = async () => {
  const { data } = await api.get('/products/reserve-clip-id')
  const clipId =
    (typeof data === 'string' ? data : '') ||
    data?.clipId ||
    data?.data?.clipId ||
    ''

  if (!clipId) {
    throw new Error('Could not generate clip ID')
  }

  return { clipId }
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

const requestUploadPresign = async (file, type, options = {}) => {
  const { data } = await api.post('/upload/presign', {
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
  return data
}

const uploadDirectToPresignedS3 = async (presign, file, onProgress) => {
  if (presign.uploadFields) {
    await uploadFileToS3Post(presign.uploadUrl, presign.uploadFields, file, onProgress)
    return
  }
  await uploadFileToS3(presign.uploadUrl, file, presign.headers, onProgress)
}

const buildPresignUploadResult = (presign, file, type) => ({
  data: {
    key: presign.key,
    filename: presign.filename,
    size: file.size,
    type,
    url: presign.url,
  },
})

const uploadMediaViaS3 = async (file, type, onProgress, options = {}) => {
  const presign = await requestUploadPresign(file, type, options)

  if (presign.method === 'proxy') {
    return uploadMediaViaProxy(file, type, onProgress, options)
  }

  try {
    await uploadDirectToPresignedS3(presign, file, onProgress)
  } catch (error) {
    throw error instanceof Error ? error : new Error('S3 upload failed')
  }

  return buildPresignUploadResult(presign, file, type)
}

/** Crop in browser, then PUT the file directly to S3 via presigned URL. */
export const uploadCroppedPreviewToS3 = async (file, onProgress, options = {}) => {
  const presign = await requestUploadPresign(file, 'preview-image', options)

  if (presign.method === 'proxy') {
    throw new Error(
      'Direct S3 upload is unavailable. Configure AWS on the API server and allow CORS on the S3 bucket for this admin domain.',
    )
  }

  try {
    await uploadDirectToPresignedS3(presign, file, onProgress)
  } catch (error) {
    throw error instanceof Error ? error : new Error('S3 upload failed')
  }

  return buildPresignUploadResult(presign, file, 'preview-image')
}

export const uploadMedia = (file, type, onProgress, options = {}) =>
  uploadMediaViaS3(file, type, onProgress, options)

export const createProduct = (payload) => api.post('/products', payload)

export const updateProduct = (id, payload) => api.put(`/products/${id}`, payload)

export const deleteProduct = (id) => api.delete(`/products/${id}`)

export const fetchOrders = () => api.get('/admin/orders')

export const fetchAdminOrders = ({
  page = 1,
  limit = 50,
  search = '',
  paymentStatus = 'all',
  status = 'all',
  customerEmail = '',
  dateFrom = '',
  dateTo = '',
} = {}) =>
  api.get('/admin/orders', {
    params: {
      page,
      limit,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(paymentStatus !== 'all' ? { paymentStatus } : {}),
      ...(status !== 'all' ? { status } : {}),
      ...(customerEmail.trim() ? { customerEmail: customerEmail.trim() } : {}),
      ...(dateFrom ? { dateFrom } : {}),
      ...(dateTo ? { dateTo } : {}),
    },
  })

export const fetchOrder = (id) => api.get(`/admin/orders/${id}`)

export const fetchTransactions = () => api.get('/admin/transactions')

export const fetchAdminTransactions = ({
  page = 1,
  limit = 50,
  search = '',
  status = 'all',
} = {}) =>
  api.get('/admin/transactions', {
    params: {
      page,
      limit,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(status !== 'all' ? { status } : {}),
    },
  })

export const fetchTransaction = (id) => api.get(`/admin/transactions/${id}`)

export const fetchSupportRequests = () => api.get('/admin/support')

export const fetchAdminSupportRequests = ({
  page = 1,
  limit = 50,
  search = '',
  status = 'all',
} = {}) =>
  api.get('/admin/support', {
    params: {
      page,
      limit,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(status !== 'all' ? { status } : {}),
    },
  })

export const fetchSupportRequest = (id) => api.get(`/admin/support/${id}`)

export const updateSupportRequest = (id, payload) => api.patch(`/admin/support/${id}`, payload)

export const replySupportRequest = (id, payload) => api.post(`/admin/support/${id}/reply`, payload)

export const fetchUsers = () => api.get('/admin/users')

export const fetchAdminUsers = ({ page = 1, limit = 50, search = '' } = {}) =>
  api.get('/admin/users', {
    params: {
      page,
      limit,
      ...(search.trim() ? { search: search.trim() } : {}),
    },
  })

export const fetchUser = (id) => api.get(`/admin/users/${id}`)
export const fetchUserEmailHistory = (id) => api.get(`/admin/users/${id}/email-history`)

export const deleteUser = (id) => api.delete(`/admin/users/${id}`)

export const sendUsersEmail = (payload) => api.post('/admin/users/email', payload)
export const fetchUsersSelection = () => api.get('/admin/users/selection')
export const saveUsersSelection = (payload) => api.post('/admin/users/selection', payload)

export const fetchSiteContent = () => api.get('/admin/site-content')

export const updateSiteContent = (payload) => api.put('/admin/site-content', payload)

export const fetchPromoCodes = () => api.get('/admin/promo-codes')

export const fetchPromoCode = (id) => api.get(`/admin/promo-codes/${id}`)

export const createPromoCode = (payload) => api.post('/admin/promo-codes', payload)

export const updatePromoCode = (id, payload) => api.put(`/admin/promo-codes/${id}`, payload)

export const deletePromoCode = (id) => api.delete(`/admin/promo-codes/${id}`)

export const fetchAdmins = () => api.get('/admin/team')

export const fetchAdminAccount = (id) => api.get(`/admin/team/${id}`)

export const fetchAdminPermissionGroups = () => api.get('/admin/team/permission-groups')

export const createAdminAccount = (payload) => api.post('/admin/team', payload)

export const updateAdminAccount = (id, payload) => api.put(`/admin/team/${id}`, payload)

export const deleteAdminAccount = (id) => api.delete(`/admin/team/${id}`)

export default api
