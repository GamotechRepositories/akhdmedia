import { Router } from 'express'
import { presignUpload, uploadMedia } from '../controllers/uploadController.js'
import { uploadSingle } from '../middleware/upload.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.post('/presign', asyncHandler(presignUpload))

router.post(
  '/',
  (req, res, next) => {
    uploadSingle(req, res, (err) => {
      if (err) {
        res.status(400).json({ message: err.message || 'Upload failed' })
        return
      }
      next()
    })
  },
  asyncHandler(uploadMedia),
)

export default router
