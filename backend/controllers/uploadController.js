import asyncHandler from '../utils/asyncHandler.js'
import { isBunnyCdnUrl, isBunnyEnabled } from '../config/bunny.js'
import { isAwsEnabled } from '../config/storage.js'
import {
  deleteBunnyFile,
  createBunnyDirectUploadForTarget,
  uploadPrivateFileToBunny,
  uploadPublicFileToBunny,
} from '../services/bunnyStorageService.js'
import {
  createPresignedUploadForTarget,
  deletePublicFile,
  getPrivateDownloadUrl,
  toAbsolutePrivateUrl,
  uploadPrivateFileToTarget,
  uploadPublicFileToTarget,
} from '../services/storageService.js'
import {
  isPrivateUploadType,
  isPublicUploadType,
  resolveUploadTarget,
} from '../utils/storagePaths.js'

const STORAGE_PROVIDERS = new Set(['aws', 'bunny'])

const readUploadContext = (req) => ({
  type: req.body?.type || req.query?.type || '',
  clipId: req.body?.clipId || req.query?.clipId || '',
  categorySlug: req.body?.categorySlug || req.query?.categorySlug || '',
  actorSlug: req.body?.actorSlug || req.query?.actorSlug || '',
  filename: req.body?.filename?.trim() || req.file?.originalname || '',
  contentType: req.body?.contentType || req.file?.mimetype || 'application/octet-stream',
  size: Number(req.body?.size) || Number(req.file?.size) || 0,
  previewIndex: Number(req.body?.previewIndex || req.query?.previewIndex) || 1,
  tier: req.body?.tier || req.query?.tier || '',
  provider: String(req.body?.provider || req.query?.provider || 'aws')
    .trim()
    .toLowerCase(),
})

const resolveStorageProvider = (requested = 'aws') => {
  const provider = STORAGE_PROVIDERS.has(requested) ? requested : 'aws'

  if (provider === 'bunny') {
    if (!isBunnyEnabled()) {
      const error = new Error(
        'Bunny Storage is not configured. Add BUNNY_STORAGE_ZONE_NAME and BUNNY_STORAGE_API_KEY to backend/.env',
      )
      error.statusCode = 400
      throw error
    }
    return 'bunny'
  }

  return 'aws'
}

export const getUploadProviders = asyncHandler(async (_req, res) => {
  res.json({
    providers: [
      {
        id: 'aws',
        label: 'AWS S3',
        cdn: process.env.AWS_S3_PUBLIC_URL || process.env.CLOUDFRONT_URL || '',
        enabled: isAwsEnabled(),
      },
      {
        id: 'bunny',
        label: 'Bunny CDN',
        cdn: process.env.BUNNY_CDN_URL || 'https://cdn-v2.akhdmedia.com',
        enabled: isBunnyEnabled(),
      },
    ],
  })
})

export const presignUpload = asyncHandler(async (req, res) => {
  const context = readUploadContext(req)

  if (!context.filename) {
    res.status(400).json({ message: 'filename is required' })
    return
  }

  if (!isPrivateUploadType(context.type) && !isPublicUploadType(context.type)) {
    res.status(400).json({ message: 'Direct upload is not supported for this type' })
    return
  }

  const provider = resolveStorageProvider(context.provider)
  const target = resolveUploadTarget(context)

  if (provider === 'bunny') {
    const result = await createBunnyDirectUploadForTarget(target, context.contentType)
    res.json({
      method: 'direct',
      provider: 'bunny',
      uploadUrl: result.uploadUrl,
      uploadFields: result.uploadFields,
      key: result.key,
      filename: result.filename,
      headers: result.headers,
      url: result.url,
      size: context.size,
      type: context.type,
    })
    return
  }

  const result = await createPresignedUploadForTarget(target, context.contentType)

  if (result.method === 'proxy') {
    res.json({ method: 'proxy', type: context.type, provider: 'aws' })
    return
  }

  res.json({
    method: 'direct',
    provider: 'aws',
    uploadUrl: result.uploadUrl,
    uploadFields: result.uploadFields,
    key: result.key,
    filename: result.filename,
    headers: result.headers,
    url: result.url,
    size: context.size,
    type: context.type,
  })
})

export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' })
    return
  }

  const context = readUploadContext(req)
  const provider = resolveStorageProvider(context.provider)
  const target = resolveUploadTarget(context)

  if (target.scope === 'private') {
    const result =
      provider === 'bunny'
        ? await uploadPrivateFileToBunny(req.file, target)
        : await uploadPrivateFileToTarget(req.file, target)

    const accessUrl =
      provider === 'bunny' && result.url
        ? result.url
        : await getPrivateDownloadUrl(result.key, result.filename, {
            inline: true,
          })

    res.json({
      key: result.key,
      filename: result.filename,
      size: req.file.size,
      type: context.type,
      provider,
      url: provider === 'bunny' ? result.url : toAbsolutePrivateUrl(accessUrl),
    })
    return
  }

  if (target.scope === 'public') {
    const result =
      provider === 'bunny'
        ? await uploadPublicFileToBunny(req.file, target)
        : await uploadPublicFileToTarget(req.file, target)

    res.json({
      url: result.url,
      key: result.key,
      filename: result.filename,
      size: req.file.size,
      type: context.type,
      provider,
    })
    return
  }

  res.status(400).json({ message: 'Invalid upload type' })
})

export const deletePublicMedia = asyncHandler(async (req, res) => {
  const url = req.body?.url?.trim() || ''
  const clipId = req.body?.clipId?.trim() || ''

  if (!url) {
    res.status(400).json({ message: 'url is required' })
    return
  }

  if (!clipId) {
    res.status(400).json({ message: 'clipId is required' })
    return
  }

  if (isBunnyCdnUrl(url)) {
    const result = await deleteBunnyFile(url)
    res.json(result)
    return
  }

  const result = await deletePublicFile(url, { clipId })
  res.json(result)
})
