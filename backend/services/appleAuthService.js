import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { getAppleClientId } from '../config/appleAuth.js'

const APPLE_KEYS_URL = 'https://appleid.apple.com/auth/keys'
const APPLE_ISSUER = 'https://appleid.apple.com'

let keysCache = null
let keysCacheTime = 0

const getAppleJwks = async () => {
  const now = Date.now()
  if (!keysCache || now - keysCacheTime > 60 * 60 * 1000) {
    const response = await fetch(APPLE_KEYS_URL)
    if (!response.ok) {
      throw new Error('Failed to fetch Apple signing keys')
    }
    keysCache = await response.json()
    keysCacheTime = now
  }
  return keysCache
}

export const verifyAppleIdentityToken = async (identityToken) => {
  const decoded = jwt.decode(identityToken, { complete: true })
  const kid = decoded?.header?.kid

  if (!kid) {
    throw new Error('Invalid Apple identity token')
  }

  const jwks = await getAppleJwks()
  const jwk = jwks.keys?.find((key) => key.kid === kid)

  if (!jwk) {
    throw new Error('Apple signing key not found')
  }

  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' })

  return jwt.verify(identityToken, publicKey, {
    algorithms: ['RS256'],
    issuer: APPLE_ISSUER,
    audience: getAppleClientId(),
  })
}
