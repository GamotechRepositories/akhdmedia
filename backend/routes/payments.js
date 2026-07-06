import { Router } from 'express'
import cartSession from '../middleware/cartSession.js'
import { optionalUser } from '../middleware/optionalUser.js'
import { getPaymentConfig, capturePayPalPayment, verifyRazorpayPayment } from '../controllers/paymentController.js'

const router = Router()

router.use(cartSession)

router.get('/config', getPaymentConfig)
router.post('/razorpay/verify', optionalUser, verifyRazorpayPayment)
router.post('/paypal/capture', optionalUser, capturePayPalPayment)

export default router
