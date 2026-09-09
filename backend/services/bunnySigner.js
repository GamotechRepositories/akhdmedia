import crypto from 'crypto'
import {
  getBunnyCdnUrl,
  getBunnyTokenAuthKey,
  isBunnyTokenAuthEnabled,
} from '../config/bunny.js'
import { SIGNED_URL_EXPIRY_SECONDS } from '../config/storage.js'

const toBunnyPath = (objectKey = '') => {
  const normalized = String(objectKey || '')
    .replace(/^bunny:/i, '')
    .replace(/^\/+/, '')
  return `/${normalized}`
}

/**
 * Bunny basic token auth (MD5).
 * Enable "Token Authentication" on the pull zone and set BUNNY_TOKEN_AUTH_KEY.
 * @see https://docs.bunny.net/cdn/security/token-authentication/basic
 */
export const getBunnySignedDownloadUrl = (objectKey, { expiresInSeconds } = {}) => {
  const path = toBunnyPath(objectKey)
  const baseUrl = `${getBunnyCdnUrl()}${path}`

  if (!isBunnyTokenAuthEnabled()) {
    return baseUrl
  }

  const expirySeconds = Number(expiresInSeconds) || SIGNED_URL_EXPIRY_SECONDS
  const expires = Math.floor(Date.now() / 1000) + expirySeconds
  const hashableBase = `${getBunnyTokenAuthKey()}${path}${expires}`
  const token = crypto
    .createHash('md5')
    .update(hashableBase)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')

  return `${baseUrl}?token=${token}&expires=${expires}`
}
