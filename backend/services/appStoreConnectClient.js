import jwt from 'jsonwebtoken'
import {
  getAscIssuerId,
  getAscKeyId,
  getAscPrivateKey,
  isAscConfigured,
} from '../config/appStoreConnect.js'

const ASC_BASE_URL = 'https://api.appstoreconnect.apple.com'
const TOKEN_TTL_SECONDS = 60 * 18

let cachedToken = { value: '', expiresAt: 0 }

const buildToken = () => {
  if (!isAscConfigured()) {
    throw new Error('App Store Connect API is not configured')
  }

  const now = Math.floor(Date.now() / 1000)
  if (cachedToken.value && cachedToken.expiresAt > now + 60) {
    return cachedToken.value
  }

  const privateKey = getAscPrivateKey()
  if (!privateKey) {
    throw new Error('App Store Connect private key is missing')
  }

  const token = jwt.sign({}, privateKey, {
    algorithm: 'ES256',
    expiresIn: TOKEN_TTL_SECONDS,
    issuer: getAscIssuerId(),
    audience: 'appstoreconnect-v1',
    header: {
      alg: 'ES256',
      kid: getAscKeyId(),
      typ: 'JWT',
    },
  })

  cachedToken = {
    value: token,
    expiresAt: now + TOKEN_TTL_SECONDS,
  }
  return token
}

export const clearAscTokenCache = () => {
  cachedToken = { value: '', expiresAt: 0 }
}

export class AscApiError extends Error {
  constructor(message, { status = 500, body = null } = {}) {
    super(message)
    this.name = 'AscApiError'
    this.status = status
    this.body = body
  }
}

export const ascRequest = async (method, path, { query, body } = {}) => {
  const url = new URL(path.startsWith('http') ? path : `${ASC_BASE_URL}${path}`)
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return
      url.searchParams.set(key, String(value))
    })
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${buildToken()}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await response.text()
  let json = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = { raw: text }
    }
  }

  if (!response.ok) {
    const detail =
      json?.errors?.map((entry) => entry.detail || entry.title).filter(Boolean).join('; ') ||
      `App Store Connect API ${response.status}`
    throw new AscApiError(detail, { status: response.status, body: json })
  }

  return json
}
