import { Router } from 'express'
import cartSession from '../middleware/cartSession.js'
import { getPaymentConfig, verifyRazorpayPayment } from '../controllers/paymentController.js'

const router = Router()

router.use(cartSession)

router.get('/config', getPaymentConfig)
router.post('/razorpay/verify', verifyRazorpayPayment)

export default router
