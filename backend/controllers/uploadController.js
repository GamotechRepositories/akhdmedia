import asyncHandler from '../utils/asyncHandler.js'
import {
  createPresignedUploadForTarget,
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

const readUploadContext = (req) => ({
  type: req.body?.type || req.query?.type || '',
  clipId: req.body?.clipId || req.query?.clipId || '',
  filename: req.body?.filename?.trim() || req.file?.originalname || '',
  contentType: req.body?.contentType || req.file?.mimetype || 'application/octet-stream',
  size: Number(req.body?.size) || Number(req.file?.size) || 0,
  previewIndex: Number(req.body?.previewIndex || req.query?.previewIndex) || 1,
  tier: req.body?.tier || req.query?.tier || '',
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

  const target = resolveUploadTarget(context)
  const result = await createPresignedUploadForTarget(target, context.contentType)

  if (result.method === 'proxy') {
    res.json({ method: 'proxy', type: context.type })
    return
  }

  res.json({
    method: 'direct',
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
  const target = resolveUploadTarget(context)

  if (target.scope === 'private') {
    const result = await uploadPrivateFileToTarget(req.file, target)
    const accessUrl = await getPrivateDownloadUrl(result.key, result.filename, {
      inline: true,
    })
    res.json({
      key: result.key,
      filename: result.filename,
      size: req.file.size,
      type: context.type,
      url: toAbsolutePrivateUrl(accessUrl),
    })
    return
  }

  if (target.scope === 'public') {
    const result = await uploadPublicFileToTarget(req.file, target)
    res.json({
      url: result.url,
      key: result.key,
      filename: result.filename,
      size: req.file.size,
      type: context.type,
    })
    return
  }

  res.status(400).json({ message: 'Invalid upload type' })
})
