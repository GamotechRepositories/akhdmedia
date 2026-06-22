import fs from 'fs'
import fsPromises from 'fs/promises'
import path from 'path'
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
  isAwsEnabled,
  isCloudFrontSigningEnabled,
  LOCAL_PRIVATE_DIR,
  LOCAL_PUBLIC_DIR,
  PRESIGNED_UPLOAD_EXPIRY_SECONDS,
  SIGNED_URL_EXPIRY_SECONDS,
} from '../config/storage.js'
import { getCloudFrontSignedDownloadUrl } from './cloudfrontSigner.js'

let s3Client = null

const getS3 = () => {
  if (!s3Client) {
    s3Client = new S3Client({
      region: getAwsRegion(),
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      // Avoid checksum headers in presigned PUT URLs — browsers cannot reproduce them.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
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

const getUploadBody = (file) => {
  if (file?.buffer) return file.buffer
  if (file?.path) return fs.createReadStream(file.path)
  return null
}

const cleanupUploadTempFile = async (file) => {
  if (!file?.path) return
  await fsPromises.unlink(file.path).catch(() => {})
}

const createS3PresignedPut = async (s3Key, contentType = '') => {
  const resolvedContentType = contentType || 'application/octet-stream'
  const command = new PutObjectCommand({
    Bucket: getAwsS3Bucket(),
    Key: s3Key,
    ContentType: resolvedContentType,
  })
  const uploadUrl = await getSignedUrl(getS3(), command, {
    expiresIn: PRESIGNED_UPLOAD_EXPIRY_SECONDS,
  })

  return {
    uploadUrl,
    uploadFields: null,
    headers: {
      'Content-Type': resolvedContentType,
    },
  }
}

export const uploadPublicFileToTarget = async (file, target) => {
  const { s3Key, key, filename } = target
  const body = getUploadBody(file)

  if (!body) {
    throw new Error('No file data')
  }

  try {
    if (isAwsEnabled()) {
      await getS3().send(
        new PutObjectCommand({
          Bucket: getAwsS3Bucket(),
          Key: s3Key,
          Body: body,
          ContentType: file.mimetype || 'application/octet-stream',
        }),
      )
      return { url: `${getPublicBaseUrl()}/${s3Key}`, key: s3Key, filename }
    }

    const relativeKey = s3Key.replace(/^public\//, '')
    const filePath = path.join(LOCAL_PUBLIC_DIR, relativeKey)
    await ensureDir(path.dirname(filePath))

    if (file.path) {
      await fsPromises.copyFile(file.path, filePath)
    } else {
      await fsPromises.writeFile(filePath, file.buffer)
    }

    return { url: getLocalPublicUrl(relativeKey), key: relativeKey, filename }
  } finally {
    await cleanupUploadTempFile(file)
  }
}

export const uploadPrivateFileToTarget = async (file, target) => {
  const { s3Key, key, filename: targetFilename } = target
  const originalFilename = sanitizeFilename(file.originalname) || targetFilename
  const body = getUploadBody(file)

  if (!body) {
    throw new Error('No file data')
  }

  try {
    if (isAwsEnabled()) {
      await getS3().send(
        new PutObjectCommand({
          Bucket: getAwsS3Bucket(),
          Key: s3Key,
          Body: body,
          ContentType: file.mimetype || 'application/octet-stream',
          ContentDisposition: `inline; filename="${originalFilename}"`,
          Metadata: {
            originalfilename: originalFilename,
          },
        }),
      )
      return { key, filename: originalFilename }
    }

    const relativeKey = key.replace(/^private\//, '')
    const filePath = path.join(LOCAL_PRIVATE_DIR, relativeKey)
    await ensureDir(path.dirname(filePath))

    if (file.path) {
      await fsPromises.copyFile(file.path, filePath)
    } else {
      await fsPromises.writeFile(filePath, file.buffer)
    }

    return { key, filename: originalFilename }
  } finally {
    await cleanupUploadTempFile(file)
  }
}

export const createPresignedUploadForTarget = async (target, contentType = '') => {
  const { s3Key, key, filename, scope } = target
  const resolvedContentType = contentType || 'application/octet-stream'

  if (!isAwsEnabled()) {
    return { method: 'proxy' }
  }

  const { uploadUrl, uploadFields, headers } = await createS3PresignedPut(
    s3Key,
    resolvedContentType,
  )

  if (scope === 'private') {
    const accessUrl = await getPrivateDownloadUrl(key, filename, { inline: true })
    return {
      method: 'direct',
      uploadUrl,
      uploadFields,
      key,
      filename,
      headers,
      url: toAbsolutePrivateUrl(accessUrl),
    }
  }

  return {
    method: 'direct',
    uploadUrl,
    uploadFields,
    key,
    filename,
    headers,
    url: `${getPublicBaseUrl()}/${s3Key}`,
  }
}

/** @deprecated use uploadPrivateFileToTarget */
export const uploadPrivateFileFromPath = async (filePath, target, filename) => {
  const buffer = await fsPromises.readFile(filePath)
  const stats = await fsPromises.stat(filePath)
  const file = {
    buffer,
    originalname: filename,
    mimetype: 'video/mp4',
    size: stats.size,
  }
  return uploadPrivateFileToTarget(file, target)
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

    if (isCloudFrontSigningEnabled()) {
      return getCloudFrontSignedDownloadUrl(s3Key)
    }

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
