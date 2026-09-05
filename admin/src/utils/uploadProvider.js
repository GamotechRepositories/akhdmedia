const STORAGE_KEY = 'akhdmedia.admin.uploadProvider'

export const UPLOAD_PROVIDERS = [
  {
    id: 'aws',
    label: 'AWS S3',
    shortLabel: 'AWS',
    cdn: 'cdn.akhdmedia.com',
  },
  {
    id: 'bunny',
    label: 'Bunny CDN',
    shortLabel: 'Bunny',
    cdn: 'cdn-v2.akhdmedia.com',
  },
]

export const getStoredUploadProvider = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'bunny' || value === 'aws') return value
  } catch {
    // ignore
  }
  return 'aws'
}

export const setStoredUploadProvider = (provider) => {
  const next = provider === 'bunny' ? 'bunny' : 'aws'
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // ignore
  }
  return next
}
