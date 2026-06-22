import './config/loadEnv.js'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './config/db.js'
import { isEmailConfigured } from './config/email.js'
import {
  isAwsEnabled,
  isCloudFrontSigningEnabled,
  getCloudFrontPrivateBaseUrl,
  LOCAL_PUBLIC_DIR,
} from './config/storage.js'
import apiRoutes from './routes/index.js'
import errorHandler from './middleware/errorHandler.js'
import seedAdmin from './seed/seedAdmin.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 5001

const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      const isLocalDev =
        process.env.NODE_ENV !== 'production' &&
        /^http:\/\/localhost:\d+$/.test(origin)

      callback(null, isLocalDev)
    },
    credentials: true,
  }),
)
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads/public', express.static(LOCAL_PUBLIC_DIR))

app.use('/api', apiRoutes)

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use(errorHandler)

const startServer = async () => {
  await connectDB()
  await seedAdmin()

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(
      isEmailConfigured()
        ? 'Email: Resend configured'
        : 'Email: Resend NOT configured (set RESEND_API_KEY and RESEND_FROM)',
    )
    console.log(
      isAwsEnabled()
        ? `Storage: AWS S3 (${process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME})`
        : 'Storage: local uploads/ (AWS not configured)',
    )
    if (isAwsEnabled()) {
      console.log(
        isCloudFrontSigningEnabled()
          ? `Private downloads: CloudFront signed URLs (${getCloudFrontPrivateBaseUrl()})`
          : 'Private downloads: S3 pre-signed URLs (set CLOUDFRONT_KEY_PAIR_ID + CLOUDFRONT_PRIVATE_KEY or CLOUDFRONT_PRIVATE_KEY_PATH)',
      )
    }
  })
}

startServer()
