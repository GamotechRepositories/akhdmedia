import multer from 'multer'

const storage = multer.memoryStorage()

const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime']

const isDeliveryUpload = (type) =>
  type === 'delivery-image' ||
  type === 'delivery-video' ||
  type === 'master-video' ||
  type === 'master-image'

export const uploadSingle = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const type = req.body?.type || req.query?.type || ''

    // Delivery originals are stored byte-for-byte — no type restriction
    if (isDeliveryUpload(type)) {
      cb(null, true)
      return
    }

    if (type.startsWith('preview-image') || type === 'preview-image' || type === 'video-poster') {
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
