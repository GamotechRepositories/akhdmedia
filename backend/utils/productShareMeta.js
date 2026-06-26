import { getAwsS3PublicUrl } from '../config/storage.js'

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const getFrontendBaseUrl = () => {
  const urls = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean)

  if (process.env.NODE_ENV === 'production') {
    const productionUrl = urls.find((url) => !/localhost/i.test(url))
    if (productionUrl) {
      return productionUrl.replace(/\/$/, '')
    }
  }

  return (urls[0] || 'http://localhost:5173').replace(/\/$/, '')
}

export const getShareApiBaseUrl = () =>
  (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5001}`).replace(
    /\/$/,
    '',
  )

const getApiBaseUrl = () => getShareApiBaseUrl()

export const resolveAbsoluteMediaUrl = (value = '') => {
  const url = String(value || '').trim()
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url

  const publicBase = getAwsS3PublicUrl() || getApiBaseUrl()
  const normalized = url.replace(/^\/+/, '')
  if (normalized.startsWith('uploads/public/')) {
    return `${getApiBaseUrl()}/${normalized}`
  }
  if (normalized.startsWith('public/')) {
    return `${publicBase}/${normalized}`
  }

  return `${publicBase}/${normalized}`
}

export const getProductPosterUrl = (product = {}) => {
  const image = (product.images || []).find(Boolean)
  if (image) return resolveAbsoluteMediaUrl(image)
  if (product.videoPoster) return resolveAbsoluteMediaUrl(product.videoPoster)
  return ''
}

export const buildProductShareDescription = (product = {}) => {
  const parts = [
    product.clipId ? `Clip ID ${product.clipId}` : '',
    product.categorySlug ? product.categorySlug.replace(/-/g, ' ') : '',
    product.description?.trim() || '',
  ].filter(Boolean)

  return parts.join(' · ').slice(0, 240)
}

export const buildProductShareHtml = ({
  title,
  description,
  imageUrl,
  productPageUrl,
}) => {
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description)
  const safeProductUrl = escapeHtml(productPageUrl)
  const safeImageUrl = imageUrl ? escapeHtml(imageUrl) : ''

  const imageTags = safeImageUrl
    ? `
    <meta property="og:image" content="${safeImageUrl}" />
    <meta property="og:image:secure_url" content="${safeImageUrl}" />
    <meta name="twitter:image" content="${safeImageUrl}" />`
    : ''

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="AKHD MEDIA &amp; CO" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:url" content="${safeProductUrl}" />${imageTags}
    <meta name="twitter:card" content="${safeImageUrl ? 'summary_large_image' : 'summary'}" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <link rel="canonical" href="${safeProductUrl}" />
    <meta http-equiv="refresh" content="0;url=${safeProductUrl}" />
  </head>
  <body>
    <p>Opening <a href="${safeProductUrl}">${safeTitle}</a>…</p>
    <script>window.location.replace(${JSON.stringify(productPageUrl)});</script>
  </body>
</html>`
}
