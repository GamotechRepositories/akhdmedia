import { getAwsS3PublicUrl } from '../config/storage.js'

export const getApiPublicBaseUrl = () =>
  (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5001}`).replace(
    /\/$/,
    '',
  )

export const getFrontendPublicBaseUrl = () => {
  const raw = process.env.FRONTEND_URL || 'http://localhost:5173'
  return raw.split(',')[0].trim().replace(/\/$/, '')
}

export const buildProductPageUrl = (productId) =>
  `${getFrontendPublicBaseUrl()}/product/${productId}`

export const buildProductSharePageUrl = (productId) =>
  `${getApiPublicBaseUrl()}/share/product/${productId}`

export const resolveShareImageUrl = (product) => {
  const candidate = (product?.images || []).find(Boolean) || product?.videoPoster || ''
  if (!candidate) return ''

  if (/^https?:\/\//i.test(candidate)) {
    return candidate
  }

  const publicBase = getAwsS3PublicUrl()?.replace(/\/$/, '')
  if (!publicBase) {
    return `${getApiPublicBaseUrl()}/uploads/public/${candidate.replace(/^public\//, '')}`
  }

  const normalized = candidate.replace(/^\//, '')
  return `${publicBase}/${normalized}`
}
