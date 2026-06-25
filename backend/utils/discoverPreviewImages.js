const stripUrlQuery = (url = '') => {
  const trimmed = url?.trim() || ''
  if (!trimmed) return ''
  return trimmed.split('?')[0].split('#')[0]
}

/** Merge DB images, S3 previews, and video poster into 3 admin form slots. */
export const resolveAdminPreviewImages = (product = {}, discovered = []) => {
  const stored = Array.isArray(product.images) ? product.images : []
  const slots = [
    stored[0] || discovered[0] || '',
    stored[1] || discovered[1] || '',
    stored[2] || discovered[2] || '',
  ].map(stripUrlQuery)

  if (!slots[0] && product.videoPoster?.trim()) {
    slots[0] = stripUrlQuery(product.videoPoster)
  }

  return slots
}
