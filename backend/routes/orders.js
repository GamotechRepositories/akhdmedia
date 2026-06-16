import { Router } from 'express'
import {
  createOrder,
  getOrder,
  getOrderDownloads,
  getProfile,
  resendOrderLicenseEmail,
  resumeOrderPayment,
  updateProfile,
} from '../controllers/orderController.js'
import cartSession from '../middleware/cartSession.js'
import { optionalUser } from '../middleware/optionalUser.js'
import { requireUser } from '../middleware/requireUser.js'

const router = Router()

router.use(cartSession)

router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.post('/', requireUser, createOrder)
router.post('/:id/payment', requireUser, resumeOrderPayment)
router.get('/:id/downloads', optionalUser, getOrderDownloads)
router.post('/:id/resend-email', optionalUser, resendOrderLicenseEmail)
router.get('/:id', optionalUser, getOrder)

export default router
