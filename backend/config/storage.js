import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const getAwsS3Bucket = () =>
  process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME || ''

export const getAwsS3PublicUrl = () =>
  process.env.AWS_S3_PUBLIC_URL || process.env.CLOUDFRONT_URL || ''

export const getCloudFrontPrivateBaseUrl = () => {
  const url =
    process.env.CLOUDFRONT_PRIVATE_URL ||
    process.env.CLOUDFRONT_URL ||
    process.env.AWS_S3_PUBLIC_URL ||
    ''
  return url.replace(/\/$/, '')
}

export const getCloudFrontPrivateKey = () => {
  const fromEnv = process.env.CLOUDFRONT_PRIVATE_KEY || ''
  if (fromEnv.trim()) {
    return fromEnv.includes('\\n') ? fromEnv.replace(/\\n/g, '\n').trim() : fromEnv.trim()
  }

  const keyPath = process.env.CLOUDFRONT_PRIVATE_KEY_PATH?.trim()
  if (!keyPath) return ''

  try {
    const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath)
    return fs.readFileSync(resolved, 'utf8').trim()
  } catch {
    return ''
  }
}

export const isCloudFrontSigningEnabled = () =>
  Boolean(
    getCloudFrontPrivateBaseUrl() &&
      process.env.CLOUDFRONT_KEY_PAIR_ID?.trim() &&
      getCloudFrontPrivateKey().trim(),
  )

export const getAwsRegion = () => process.env.AWS_REGION || 'ap-south-1'

export const isAwsEnabled = () =>
  Boolean(
    process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim() &&
      getAwsS3Bucket(),
  )

/** @deprecated use getAwsS3Bucket() — kept for older imports */
export const AWS_S3_BUCKET = getAwsS3Bucket()

export const AWS_REGION = getAwsRegion()

export const AWS_S3_PUBLIC_URL = getAwsS3PublicUrl()

export const AWS_S3_PUBLIC_PREFIX = process.env.AWS_S3_PUBLIC_PREFIX || 'public'
export const AWS_S3_PRIVATE_PREFIX = process.env.AWS_S3_PRIVATE_PREFIX || 'private'

export const LOCAL_UPLOAD_ROOT = path.join(__dirname, '..', 'uploads')
export const LOCAL_PUBLIC_DIR = path.join(LOCAL_UPLOAD_ROOT, 'public')
export const LOCAL_PRIVATE_DIR = path.join(LOCAL_UPLOAD_ROOT, 'private')

export const SIGNED_URL_EXPIRY_SECONDS = Number(
  process.env.AWS_SIGNED_URL_EXPIRY || 259200,
)

export const PRESIGNED_UPLOAD_EXPIRY_SECONDS = Number(
  process.env.AWS_PRESIGNED_UPLOAD_EXPIRY || 3600,
)
