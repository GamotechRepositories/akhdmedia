import fs from 'fs'
import multer from 'multer'
import os from 'os'
import path from 'path'

const uploadTempDir = path.join(os.tmpdir(), 'akhdmedia-uploads')
fs.mkdirSync(uploadTempDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadTempDir)
  },
  filename: (_req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_')
    cb(null, `${Date.now()}-${safeName}`)
  },
})

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const emailAttachmentTypes = [...imageTypes, 'application/pdf']
const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime']

const isDeliveryUpload = (type) =>
  type === 'delivery-image' ||
  type === 'delivery-video' ||
  type === 'master-video' ||
  type === 'master-image'

export const uploadSingle = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const type = req.body?.type || req.query?.type || ''

    // Delivery originals are stored byte-for-byte — no type restriction
    if (isDeliveryUpload(type)) {
      cb(null, true)
      return
    }

    if (type === 'email-attachment') {
      if (!emailAttachmentTypes.includes(file.mimetype)) {
        cb(new Error('Only JPEG, PNG, WebP, GIF images or PDF files are allowed'))
        return
      }
    } else if (type.startsWith('preview-image') || type === 'preview-image' || type === 'video-poster') {
      if (!imageTypes.includes(file.mimetype)) {
        cb(new Error('Only JPEG, PNG, WebP, or GIF images are allowed'))
        return
      }
    } else if (type.startsWith('preview-video') || type === 'preview-video') {
      if (!videoTypes.includes(file.mimetype)) {
        cb(new Error('Only MP4, WebM, or MOV videos are allowed'))
        return
      }
    }

    cb(null, true)
  },
}).single('file')
