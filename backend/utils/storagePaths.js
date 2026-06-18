import path from 'path'
import AppError from './AppError.js'
import { isValidClipId } from './licenseIds.js'
import { AWS_S3_PRIVATE_PREFIX, AWS_S3_PUBLIC_PREFIX } from '../config/storage.js'

const sanitizeFilename = (filename) =>
  path.basename(filename || '').replace(/[^a-zA-Z0-9._-]/g, '_')

const getExtension = (filename, fallback = '') => {
  const ext = path.extname(filename || '').toLowerCase()
  return ext || fallback
}

const sanitizeTier = (tier = '') =>
  tier.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'default'

export const assertClipIdForUpload = (clipId = '') => {
  const normalized = clipId.trim().toUpperCase()
  if (!isValidClipId(normalized)) {
    throw new AppError('Clip ID is required before uploading files', 400)
  }
  return normalized
}

/**
 * Production S3 layout:
 *   public/products/{clipId}/previews/01.jpg
 *   public/products/{clipId}/poster.jpg
 *   public/products/{clipId}/demo.mp4
 *   private/products/{clipId}/master/original.ext
 */
const sanitizeCategorySlug = (value = '') =>
  value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')

export const resolveUploadTarget = ({
  type,
  clipId,
  categorySlug = '',
  actorSlug = '',
  filename = '',
  previewIndex = 1,
  tier = '',
}) => {
  const originalFilename = sanitizeFilename(filename)

  if (type === 'category-cover') {
    const slug = sanitizeCategorySlug(categorySlug)
    if (!slug) {
      throw new AppError('Category slug is required before uploading cover image', 400)
    }
    const ext = getExtension(filename, '.jpg')
    const objectName = `cover-${Date.now()}${ext}`
    const s3Key = `${AWS_S3_PUBLIC_PREFIX}/categories/${slug}/${objectName}`
    return {
      scope: 'public',
      s3Key,
      key: s3Key,
      filename: originalFilename,
    }
  }

  if (type === 'hero-slide') {
    const ext = getExtension(filename, '.jpg')
    const objectName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
    const s3Key = `${AWS_S3_PUBLIC_PREFIX}/site/hero/${objectName}`
    return {
      scope: 'public',
      s3Key,
      key: s3Key,
      filename: originalFilename,
    }
  }

  if (type === 'actor-image') {
    const slug = sanitizeCategorySlug(actorSlug || '')
    if (!slug) {
      throw new AppError('Actor slug is required before uploading image', 400)
    }
    const ext = getExtension(filename, '.jpg')
    const objectName = `profile-${Date.now()}${ext}`
    const s3Key = `${AWS_S3_PUBLIC_PREFIX}/actors/${slug}/${objectName}`
    return {
      scope: 'public',
      s3Key,
      key: s3Key,
      filename: originalFilename,
    }
  }

  const id = assertClipIdForUpload(clipId)

  switch (type) {
    case 'master-video':
    case 'master-image': {
      const ext = getExtension(filename, '.bin')
      const objectName = `original${ext}`
      const s3Key = `${AWS_S3_PRIVATE_PREFIX}/products/${id}/master/${objectName}`
      return {
        scope: 'private',
        s3Key,
        key: `private/products/${id}/master/${objectName}`,
        filename: originalFilename,
      }
    }
    case 'preview-image': {
      const slot = String(Math.min(3, Math.max(1, Number(previewIndex) || 1))).padStart(2, '0')
      const ext = getExtension(filename, '.jpg')
      const objectName = `${slot}${ext}`
      const s3Key = `${AWS_S3_PUBLIC_PREFIX}/products/${id}/previews/${objectName}`
      return {
        scope: 'public',
        s3Key,
        key: s3Key,
        filename: originalFilename,
      }
    }
    case 'preview-video': {
      const ext = getExtension(filename, '.mp4')
      const objectName = `demo${ext}`
      const s3Key = `${AWS_S3_PUBLIC_PREFIX}/products/${id}/${objectName}`
      return {
        scope: 'public',
        s3Key,
        key: s3Key,
        filename: originalFilename,
      }
    }
    case 'video-poster': {
      const ext = getExtension(filename, '.jpg')
      const objectName = `poster${ext}`
      const s3Key = `${AWS_S3_PUBLIC_PREFIX}/products/${id}/${objectName}`
      return {
        scope: 'public',
        s3Key,
        key: s3Key,
        filename: originalFilename,
      }
    }
    case 'delivery-video': {
      const tierLabel = sanitizeTier(tier)
      const ext = getExtension(filename, '.mp4')
      const objectName = `${tierLabel}${ext}`
      const s3Key = `${AWS_S3_PRIVATE_PREFIX}/products/${id}/delivery/${objectName}`
      return {
        scope: 'private',
        s3Key,
        key: `private/products/${id}/delivery/${objectName}`,
        filename: originalFilename,
      }
    }
    case 'delivery-image': {
      const tierLabel = sanitizeTier(tier)
      const slot = String(Math.min(3, Math.max(1, Number(previewIndex) || 1))).padStart(2, '0')
      const ext = getExtension(filename, '.jpg')
      const objectName = `${tierLabel}-${slot}${ext}`
      const s3Key = `${AWS_S3_PRIVATE_PREFIX}/products/${id}/delivery/${objectName}`
      return {
        scope: 'private',
        s3Key,
        key: `private/products/${id}/delivery/${objectName}`,
        filename: originalFilename,
      }
    }
    default:
      throw new AppError('Invalid upload type', 400)
  }
}

export const isPrivateUploadType = (type) =>
  type === 'delivery-image' ||
  type === 'delivery-video' ||
  type === 'master-video' ||
  type === 'master-image'

export const isPublicUploadType = (type) =>
  type === 'preview-image' ||
  type === 'preview-video' ||
  type === 'video-poster' ||
  type === 'category-cover' ||
  type === 'hero-slide' ||
  type === 'actor-image'
