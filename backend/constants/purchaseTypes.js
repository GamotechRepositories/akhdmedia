export const PURCHASE_TYPES = {
  STANDARD: 'STANDARD',
  APPLE_IAP: 'APPLE_IAP',
}

export const PURCHASE_TYPE_LIST = Object.values(PURCHASE_TYPES)

export const DEFAULT_PURCHASE_TYPE = PURCHASE_TYPES.STANDARD

/** App Store product id: com.akhdmedia.video.{mongoObjectId} */
export const buildAppleProductId = (productId = '', mediaType = 'video') => {
  const id = String(productId || '').trim()
  if (!id) return ''
  const kind = String(mediaType || 'video').trim().toLowerCase() === 'image' ? 'image' : 'video'
  return `com.akhdmedia.${kind}.${id}`
}
