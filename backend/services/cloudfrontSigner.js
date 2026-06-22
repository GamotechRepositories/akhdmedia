import { getSignedUrl } from '@aws-sdk/cloudfront-signer'
import {
  getCloudFrontPrivateBaseUrl,
  getCloudFrontPrivateKey,
  SIGNED_URL_EXPIRY_SECONDS,
} from '../config/storage.js'

const buildCloudFrontObjectUrl = (objectKey = '') => {
  const baseUrl = getCloudFrontPrivateBaseUrl()
  const normalizedKey = objectKey.replace(/^\/+/, '')
  return `${baseUrl}/${normalizedKey}`
}

export const getCloudFrontSignedDownloadUrl = (objectKey, { expiresInSeconds } = {}) => {
  const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID?.trim()
  const privateKey = getCloudFrontPrivateKey()

  if (!keyPairId || !privateKey) {
    throw new Error('CloudFront signing is not configured')
  }

  const expirySeconds = Number(expiresInSeconds) || SIGNED_URL_EXPIRY_SECONDS
  const dateLessThan = new Date(Date.now() + expirySeconds * 1000).toISOString()

  return getSignedUrl({
    url: buildCloudFrontObjectUrl(objectKey),
    keyPairId,
    privateKey,
    dateLessThan,
  })
}
