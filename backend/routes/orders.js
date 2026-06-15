import { Router } from 'express'
import {
  createOrder,
  getOrder,
  getOrderDownloads,
  getProfile,
  resendOrderLicenseEmail,
  updateProfile,
} from '../controllers/orderController.js'
import cartSession from '../middleware/cartSession.js'

const router = Router()

router.use(cartSession)

router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.post('/', createOrder)
router.get('/:id/downloads', getOrderDownloads)
router.post('/:id/resend-email', resendOrderLicenseEmail)
router.get('/:id', getOrder)

export default router
