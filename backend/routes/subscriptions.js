import { Router } from 'express'
import {
  checkProductClaimStatus,
  claimProduct,
  createCheckout,
  getMySubscription,
  getPlans,
  verifyPayment,
  cancelSubscription,
  getSubscriptionReceipt,
  downloadSubscriptionInvoice,
  razorpayWebhook,
  verifyPayPalPayment,
  paypalWebhook,
} from '../controllers/subscriptionController.js'
import { requireUser } from '../middleware/requireUser.js'
import { optionalUser } from '../middleware/optionalUser.js'

const router = Router()

// Public: view all active plans
router.get('/plans', getPlans)

// Authenticated user subscription operations
router.get('/my-subscription', requireUser, getMySubscription)
router.post('/checkout', requireUser, createCheckout)
router.post('/verify', requireUser, verifyPayment)
router.post('/paypal/verify', requireUser, verifyPayPalPayment)
router.post('/paypal/webhook', paypalWebhook)
router.post('/cancel', requireUser, cancelSubscription)
router.get('/receipt/:id', optionalUser, getSubscriptionReceipt)
router.get('/invoice-pdf/:id', optionalUser, downloadSubscriptionInvoice)
router.get('/receipt-pdf/:id', optionalUser, downloadSubscriptionInvoice)

// Webhook listener for Razorpay recurring billing (AutoPay events)
router.post('/webhook', razorpayWebhook)

// Claim video with subscription quota
router.get('/claim-status/:productId', optionalUser, checkProductClaimStatus)
router.post('/claim/:productId', requireUser, claimProduct)

export default router
