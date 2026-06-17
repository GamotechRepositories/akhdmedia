import asyncHandler from '../utils/asyncHandler.js'
import {
  createPrivatePresignedUpload,
  createPublicPresignedUpload,
  getPrivateDownloadUrl,
  toAbsolutePrivateUrl,
  uploadPrivateFile,
  uploadPublicFile,
} from '../services/storageService.js'

const folderForType = (type) => {
  if (type === 'master-video') return 'delivery/master-videos'
  if (type === 'master-image') return 'delivery/master-images'
  if (type === 'preview-image') return 'storefront/preview-images'
  if (type === 'video-poster') return 'storefront/video-posters'
  if (type === 'preview-video') return 'storefront/demo-videos'
  if (type === 'delivery-image') return 'delivery/images'
  if (type === 'delivery-video') return 'delivery/videos/legacy'
  return 'misc'
}

const isPrivateUpload = (type) =>
  type === 'delivery-image' ||
  type === 'delivery-video' ||
  type === 'master-video' ||
  type === 'master-image'

const isPublicUpload = (type) =>
  type === 'preview-image' || type === 'preview-video' || type === 'video-poster'

export const presignUpload = asyncHandler(async (req, res) => {
  const type = req.body?.type || req.query?.type || ''
  const filename = req.body?.filename?.trim() || ''
  const contentType = req.body?.contentType || 'application/octet-stream'
  const size = Number(req.body?.size) || 0

  if (!filename) {
    res.status(400).json({ message: 'filename is required' })
    return
  }

  if (!isPrivateUpload(type) && !isPublicUpload(type)) {
    res.status(400).json({ message: 'Direct upload is not supported for this type' })
    return
  }

  const folder = folderForType(type)
  const result = isPublicUpload(type)
    ? await createPublicPresignedUpload(folder, filename, contentType)
    : await createPrivatePresignedUpload(folder, filename, contentType)

  if (result.method === 'proxy') {
    res.json({ method: 'proxy', type })
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
    size,
    type,
  })
})

export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' })
    return
  }

  const type = req.body?.type || req.query?.type || ''
  const folder = folderForType(type)

  if (isPrivateUpload(type)) {
    const result = await uploadPrivateFile(req.file, folder)
    const accessUrl = await getPrivateDownloadUrl(result.key, result.filename, {
      inline: true,
    })
    res.json({
      key: result.key,
      filename: result.filename,
      size: req.file.size,
      type,
      url: toAbsolutePrivateUrl(accessUrl),
    })
    return
  }

  if (isPublicUpload(type)) {
    const result = await uploadPublicFile(req.file, folder)
    res.json({ url: result.url, key: result.key, type })
    return
  }

  res.status(400).json({ message: 'Invalid upload type' })
})
