import fs from 'fs'

/**
 * App Store Connect API credentials.
 *
 * Create a key: App Store Connect → Users and Access → Integrations → App Store Connect API
 * Role must allow In-App Purchase management (Admin / App Manager / Account Holder).
 */
const trim = (value = '') => String(value || '').trim()

export const getAscIssuerId = () => trim(process.env.APPLE_ASC_ISSUER_ID)
export const getAscKeyId = () => trim(process.env.APPLE_ASC_KEY_ID)
export const getAscAppId = () => trim(process.env.APPLE_ASC_APP_ID)
export const getAscBundleId = () =>
  trim(process.env.APPLE_ASC_BUNDLE_ID || 'com.akhdmedia.ios')

/** PEM contents, or path to .p8 file via APPLE_ASC_PRIVATE_KEY_PATH */
export const getAscPrivateKey = () => {
  const inline = trim(process.env.APPLE_ASC_PRIVATE_KEY)
  if (inline) {
    return inline.includes('\\n') ? inline.replace(/\\n/g, '\n') : inline
  }
  const keyPath = trim(process.env.APPLE_ASC_PRIVATE_KEY_PATH)
  if (!keyPath) return ''
  return fs.readFileSync(keyPath, 'utf8')
}

export const hasAscPrivateKeyConfigured = () =>
  Boolean(trim(process.env.APPLE_ASC_PRIVATE_KEY) || trim(process.env.APPLE_ASC_PRIVATE_KEY_PATH))

export const isAscConfigured = () =>
  Boolean(getAscIssuerId() && getAscKeyId() && getAscAppId() && hasAscPrivateKeyConfigured())

/** INR catalog price → USD target used to pick nearest Apple price point */
export const getAscInrToUsdRate = () => {
  const rate = Number(process.env.APPLE_ASC_INR_TO_USD_RATE || 83)
  return Number.isFinite(rate) && rate > 0 ? rate : 83
}

export const isAscSyncEnabled = () =>
  process.env.APPLE_ASC_SYNC_ENABLED !== 'false' && isAscConfigured()
