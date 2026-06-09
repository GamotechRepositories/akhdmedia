import asyncHandler from '../utils/asyncHandler.js'
import { uploadPrivateFile, uploadPublicFile } from '../services/storageService.js'

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

export const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' })
    return
  }

  const type = req.body.type || ''
  const folder = folderForType(type)

  if (isPrivateUpload(type)) {
    const result = await uploadPrivateFile(req.file, folder)
    res.json({
      key: result.key,
      filename: result.filename,
      size: req.file.size,
      type,
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
