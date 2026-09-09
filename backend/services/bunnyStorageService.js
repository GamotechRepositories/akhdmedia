import fs from 'fs/promises'
import {
  getBunnyCdnUrl,
  getBunnyStorageApiKey,
  getBunnyStorageHostname,
  getBunnyStorageZoneName,
  isBunnyEnabled,
} from '../config/bunny.js'

const getUploadBody = async (file) => {
  if (file?.buffer) return file.buffer
  if (file?.path) return fs.readFile(file.path)
  return null
}

const cleanupUploadTempFile = async (file) => {
  if (!file?.path) return
  await fs.unlink(file.path).catch(() => {})
}

const normalizeStoragePath = (key = '') =>
  String(key || '')
    .replace(/^\/+/, '')
    .replace(/\\/g, '/')

export const getBunnyPublicUrl = (key = '') => {
  const pathKey = normalizeStoragePath(key)
  if (!pathKey) return ''
  return `${getBunnyCdnUrl()}/${pathKey}`
}

export const bunnyPublicUrlToKey = (url = '') => {
  const cleaned = String(url || '').trim().split('?')[0].split('#')[0]
  if (!cleaned) return ''

  if (!cleaned.includes('://')) {
    return normalizeStoragePath(cleaned)
  }

  try {
    const parsed = new URL(cleaned)
    return normalizeStoragePath(parsed.pathname)
  } catch {
    return ''
  }
}

const buildBunnyStorageUrl = (key = '') => {
  const zone = getBunnyStorageZoneName()
  const host = getBunnyStorageHostname()
  const pathKey = normalizeStoragePath(key)
  const encodedPath = pathKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
  return `https://${host}/${zone}/${encodedPath}`
}

const assertBunnyConfigured = () => {
  if (!isBunnyEnabled()) {
    throw new Error(
      'Bunny Storage is not configured. Set BUNNY_STORAGE_ZONE_NAME and BUNNY_STORAGE_API_KEY in backend/.env',
    )
  }
}

/** Browser uploads PUT directly to Bunny — avoids API 413 body limits. */
export const createBunnyDirectUploadForTarget = (target, contentType = '') => {
  assertBunnyConfigured()

  const { s3Key, key, filename, scope } = target
  const resolvedContentType = contentType || 'application/octet-stream'
  const publicUrl = getBunnyPublicUrl(s3Key)

  return {
    method: 'direct',
    provider: 'bunny',
    uploadUrl: buildBunnyStorageUrl(s3Key),
    uploadFields: null,
    headers: {
      AccessKey: getBunnyStorageApiKey(),
      'Content-Type': resolvedContentType,
    },
    // Private master keys store the CDN URL so download flow can pass it through.
    key: scope === 'private' ? publicUrl : key,
    filename,
    url: publicUrl,
  }
}

const putBunnyObject = async (key, body, contentType = 'application/octet-stream') => {
  assertBunnyConfigured()

  const response = await fetch(buildBunnyStorageUrl(key), {
    method: 'PUT',
    headers: {
      AccessKey: getBunnyStorageApiKey(),
      'Content-Type': contentType || 'application/octet-stream',
    },
    body,
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `Bunny upload failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`,
    )
  }
}

export const uploadPublicFileToBunny = async (file, target) => {
  const { s3Key, filename } = target
  const body = await getUploadBody(file)

  if (!body) {
    throw new Error('No file data')
  }

  try {
    await putBunnyObject(s3Key, body, file.mimetype || 'application/octet-stream')
    return {
      url: getBunnyPublicUrl(s3Key),
      key: s3Key,
      filename,
      provider: 'bunny',
    }
  } finally {
    await cleanupUploadTempFile(file)
  }
}

export const uploadPrivateFileToBunny = async (file, target) => {
  const { s3Key, key, filename: targetFilename } = target
  const originalFilename =
    String(file.originalname || targetFilename || 'file')
      .split(/[/\\]/)
      .pop()
      .replace(/[^a-zA-Z0-9._-]/g, '_') || targetFilename
  const body = await getUploadBody(file)

  if (!body) {
    throw new Error('No file data')
  }

  try {
    await putBunnyObject(s3Key, body, file.mimetype || 'application/octet-stream')
    const url = getBunnyPublicUrl(s3Key)
    return {
      // Store CDN URL as key so existing download flow can pass it through.
      key: url,
      filename: originalFilename,
      url,
      provider: 'bunny',
    }
  } finally {
    await cleanupUploadTempFile(file)
  }
}

export const deleteBunnyFile = async (urlOrKey = '') => {
  assertBunnyConfigured()

  const key = urlOrKey.includes('://')
    ? bunnyPublicUrlToKey(urlOrKey)
    : normalizeStoragePath(urlOrKey)

  if (!key) {
    throw new Error('Invalid Bunny file URL')
  }

  const response = await fetch(buildBunnyStorageUrl(key), {
    method: 'DELETE',
    headers: {
      AccessKey: getBunnyStorageApiKey(),
    },
  })

  if (!response.ok && response.status !== 404) {
    const detail = await response.text().catch(() => '')
    throw new Error(
      `Bunny delete failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`,
    )
  }

  return { ok: true, key, provider: 'bunny' }
}
