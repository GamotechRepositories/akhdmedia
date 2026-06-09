import { Router } from 'express'
import asyncHandler from '../utils/asyncHandler.js'
import { readPrivateFile } from '../services/storageService.js'
import { isAwsEnabled } from '../config/storage.js'

const router = Router()

const guessContentType = (filename = '') => {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    mxf: 'application/mxf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    tiff: 'image/tiff',
    tif: 'image/tiff',
  }
  return map[ext] || 'application/octet-stream'
}

router.get(
  '/download/*key',
  asyncHandler(async (req, res) => {
    if (isAwsEnabled()) {
      res.status(404).json({ message: 'Use signed download URLs' })
      return
    }

    const key = `private/${req.params.key}`
    const filename = req.query.name || 'download'
    const { body, contentType } = await readPrivateFile(key)

    res.setHeader('Content-Type', contentType === 'application/octet-stream' ? guessContentType(filename) : contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(body)
  }),
)

export default router
