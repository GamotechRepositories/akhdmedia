import fsPromises from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  getAwsRegion,
  getAwsS3Bucket,
  getAwsS3PublicUrl,
  AWS_S3_PRIVATE_PREFIX,
  AWS_S3_PUBLIC_PREFIX,
  isAwsEnabled,
  LOCAL_PRIVATE_DIR,
  LOCAL_PUBLIC_DIR,
  SIGNED_URL_EXPIRY_SECONDS,
} from '../config/storage.js'

let s3Client = null

const getS3 = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: getAwsRegion(),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  }
  return s3Client
}

const ensureDir = async (dir) => {
  await fsPromises.mkdir(dir, { recursive: true })
}

export const resolveLocalPrivatePath = (key = '') => {
  const relativeKey = key.replace(/^private\//, '').replace(`${AWS_S3_PRIVATE_PREFIX}/`, '')
  return path.join(LOCAL_PRIVATE_DIR, relativeKey)
}

export const resolvePrivateKey = (key = '') => {
  if (!key) return ''
  if (key.startsWith('private/')) return key
  if (key.startsWith(`${AWS_S3_PRIVATE_PREFIX}/`)) return `private/${key.replace(`${AWS_S3_PRIVATE_PREFIX}/`, '')}`
  return `private/${key}`
}

const sanitizeFilename = (filename) =>
  path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_')

const buildKey = (prefix, folder, filename) => {
  const safeName = sanitizeFilename(filename)
  return `${prefix}/${folder}/${randomUUID()}-${safeName}`
}

/** Preserves original filename in storage path for delivery downloads */
const buildDeliveryKey = (prefix, folder, filename) => {
  const safeName = sanitizeFilename(filename)
  return `${prefix}/${folder}/${randomUUID()}/${safeName}`
}

export const getFilenameFromKey = (key = '') => {
  if (!key || /^https?:\/\//i.test(key)) return ''
  const parts = key.split('/')
  return parts[parts.length - 1] || ''
}

const getPublicBaseUrl = () => {
  const publicUrl = getAwsS3PublicUrl()
  if (publicUrl) {
    return publicUrl.replace(/\/$/, '')
  }
  return `https://${getAwsS3Bucket()}.s3.${getAwsRegion()}.amazonaws.com`
}

const getApiBase = () =>
  (process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 5001}`).replace(
    /\/$/,
    '',
  )

const getLocalPublicUrl = (key) =>
  `${getApiBase()}/uploads/public/${key.replace(/^public\//, '')}`

export const uploadPublicFile = async (file, folder) => {
  const key = buildKey(AWS_S3_PUBLIC_PREFIX, folder, file.originalname)

  if (isAwsEnabled()) {
    await getS3().send(
      new PutObjectCommand({
        Bucket: getAwsS3Bucket(),
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    )
    return { url: `${getPublicBaseUrl()}/${key}`, key }
  }

  const relativeKey = key.replace(`${AWS_S3_PUBLIC_PREFIX}/`, '')
  const filePath = path.join(LOCAL_PUBLIC_DIR, relativeKey)
  await ensureDir(path.dirname(filePath))
  await fsPromises.writeFile(filePath, file.buffer)
  return { url: getLocalPublicUrl(relativeKey), key: relativeKey }
}

export const uploadPrivateFile = async (file, folder) => {
  const originalFilename = sanitizeFilename(file.originalname)
  const key = buildDeliveryKey(AWS_S3_PRIVATE_PREFIX, folder, file.originalname)

  if (isAwsEnabled()) {
    await getS3().send(
      new PutObjectCommand({
        Bucket: getAwsS3Bucket(),
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || 'application/octet-stream',
        ContentDisposition: `inline; filename="${originalFilename}"`,
        Metadata: {
          originalfilename: originalFilename,
        },
      }),
    )
    return { key: `private/${key.replace(`${AWS_S3_PRIVATE_PREFIX}/`, '')}`, filename: originalFilename }
  }

  const relativeKey = key.replace(`${AWS_S3_PRIVATE_PREFIX}/`, '')
  const filePath = path.join(LOCAL_PRIVATE_DIR, relativeKey)
  await ensureDir(path.dirname(filePath))
  await fsPromises.writeFile(filePath, file.buffer)
  return { key: `private/${relativeKey}`, filename: originalFilename }
}

export const uploadPrivateFileFromPath = async (filePath, folder, filename) => {
  const buffer = await fsPromises.readFile(filePath)
  const stats = await fsPromises.stat(filePath)
  const file = {
    buffer,
    originalname: filename,
    mimetype: 'video/mp4',
    size: stats.size,
  }
  return uploadPrivateFile(file, folder)
}

export const downloadPrivateFileToPath = async (key, destPath) => {
  const relativeKey = key.replace(/^private\//, '').replace(`${AWS_S3_PRIVATE_PREFIX}/`, '')
  await ensureDir(path.dirname(destPath))

  if (isAwsEnabled()) {
    const s3Key = key.startsWith(`${AWS_S3_PRIVATE_PREFIX}/`)
      ? key
      : `${AWS_S3_PRIVATE_PREFIX}/${relativeKey}`
    const response = await getS3().send(
      new GetObjectCommand({ Bucket: getAwsS3Bucket(), Key: s3Key }),
    )
    const body = await response.Body.transformToByteArray()
    await fsPromises.writeFile(destPath, body)
    return destPath
  }

  const sourcePath = path.join(LOCAL_PRIVATE_DIR, relativeKey)
  await fsPromises.copyFile(sourcePath, destPath)
  return destPath
}

export const toAbsolutePrivateUrl = (url = '') => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${getApiBase()}${url.startsWith('/') ? url : `/${url}`}`
}

export const getPrivateDownloadUrl = async (key, filename = '', options = {}) => {
  if (!key) return null

  if (/^https?:\/\//i.test(key)) return key

  const downloadName = filename || getFilenameFromKey(key) || 'download'
  const disposition = options.inline ? 'inline' : 'attachment'

  if (isAwsEnabled()) {
    const s3Key = key.startsWith(`${AWS_S3_PRIVATE_PREFIX}/`)
      ? key
      : `${AWS_S3_PRIVATE_PREFIX}/${key.replace(/^private\//, '')}`
    const command = new GetObjectCommand({
      Bucket: getAwsS3Bucket(),
      Key: s3Key,
      ResponseContentDisposition: `${disposition}; filename="${downloadName}"`,
    })
    return getSignedUrl(getS3(), command, { expiresIn: SIGNED_URL_EXPIRY_SECONDS })
  }

  const relativeKey = key.replace(/^private\//, '')
  return `/api/files/download/${relativeKey}?name=${encodeURIComponent(downloadName)}`
}

export const readPrivateFile = async (key) => {
  const relativeKey = key.replace(/^private\//, '').replace(`${AWS_S3_PRIVATE_PREFIX}/`, '')

  if (isAwsEnabled()) {
    const s3Key = key.startsWith(AWS_S3_PRIVATE_PREFIX)
      ? key
      : `${AWS_S3_PRIVATE_PREFIX}/${relativeKey}`
    const response = await getS3().send(
      new GetObjectCommand({ Bucket: getAwsS3Bucket(), Key: s3Key }),
    )
    return {
      body: response.Body,
      contentType: response.ContentType || 'application/octet-stream',
    }
  }

  const filePath = path.join(LOCAL_PRIVATE_DIR, relativeKey)
  const body = await fsPromises.readFile(filePath)
  return { body, contentType: 'application/octet-stream' }
}
