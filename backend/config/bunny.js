export const getBunnyStorageZoneName = () =>
  process.env.BUNNY_STORAGE_ZONE_NAME?.trim() || ''

export const getBunnyStorageZoneId = () =>
  process.env.BUNNY_STORAGE_ZONE_ID?.trim() || ''

export const getBunnyStorageApiKey = () =>
  process.env.BUNNY_STORAGE_API_KEY?.trim() ||
  process.env.BUNNY_STORAGE_PASSWORD?.trim() ||
  ''

export const getBunnyStorageHostname = () =>
  (
    process.env.BUNNY_STORAGE_HOSTNAME?.trim() ||
    'storage.bunnycdn.com'
  ).replace(/^https?:\/\//i, '').replace(/\/$/, '')

export const getBunnyCdnUrl = () =>
  (
    process.env.BUNNY_CDN_URL?.trim() ||
    'https://cdn-v2.akhdmedia.com'
  ).replace(/\/$/, '')

/** Pull-zone URL Token Authentication Key (Security tab). */
export const getBunnyTokenAuthKey = () =>
  process.env.BUNNY_TOKEN_AUTH_KEY?.trim() || ''

export const isBunnyTokenAuthEnabled = () =>
  Boolean(getBunnyCdnUrl() && getBunnyTokenAuthKey())

export const BUNNY_KEY_PREFIX = 'bunny:'

export const toBunnyStorageKey = (key = '') =>
  String(key || '').replace(new RegExp(`^${BUNNY_KEY_PREFIX}`, 'i'), '')

export const toBunnyStoredKey = (storagePath = '') => {
  const normalized = String(storagePath || '').replace(/^\/+/, '')
  if (!normalized) return ''
  if (normalized.toLowerCase().startsWith(BUNNY_KEY_PREFIX)) return normalized
  return `${BUNNY_KEY_PREFIX}${normalized}`
}

export const isBunnyStoredKey = (key = '') => {
  const value = String(key || '').trim()
  if (!value) return false
  if (value.toLowerCase().startsWith(BUNNY_KEY_PREFIX)) return true
  return isBunnyCdnUrl(value)
}

export const isBunnyEnabled = () =>
  Boolean(getBunnyStorageZoneName() && getBunnyStorageApiKey())

export const isBunnyCdnUrl = (url = '') => {
  const cleaned = String(url || '').trim()
  if (!cleaned) return false

  try {
    const host = new URL(cleaned).hostname.toLowerCase()
    const cdnHost = new URL(getBunnyCdnUrl()).hostname.toLowerCase()
    return host === cdnHost || host.endsWith('.b-cdn.net')
  } catch {
    return /cdn-v2\.akhdmedia\.com/i.test(cleaned)
  }
}
