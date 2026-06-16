import asyncHandler from '../utils/asyncHandler.js'
import { formatOrderResponse } from '../utils/formatCart.js'
import {
  confirmOnlineOrderPayment,
  resolveAccessibleOrder,
} from '../services/orderService.js'
import { getOrderItemDownloads } from '../services/downloadService.js'
import { sendOrderLicenseEmail } from '../services/emailService.js'
import {
  getRazorpayKeyId,
  verifyRazorpaySignature,
} from '../services/paymentService.js'
import AppError from '../utils/AppError.js'
import { getUserById } from '../services/userAuthService.js'

const resolveOrderForPayment = async (req, orderId) => {
  if (req.user?.id) {
    const user = await getUserById(req.user.id)
    return resolveAccessibleOrder({
      sessionId: req.sessionId,
      userId: user._id,
      userEmail: user.email,
      orderId,
    })
  }

  if (!req.sessionId) {
    throw new AppError('Order not found', 404)
  }

  return resolveAccessibleOrder({
    sessionId: req.sessionId,
    orderId,
  })
}

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    orderId,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
    clearCart = false,
  } = req.body

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError('Missing payment verification details', 400)
  }

  const order = await resolveOrderForPayment(req, orderId)

  if (order.paymentStatus === 'paid') {
    return res.json({
      success: true,
      message: 'Payment already verified',
      data: { order: formatOrderResponse(order) },
    })
  }

  if (order.razorpayOrderId && order.razorpayOrderId !== razorpayOrderId) {
    throw new AppError('Payment order mismatch', 400)
  }

  const isValid = verifyRazorpaySignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  })

  if (!isValid) {
    throw new AppError('Payment verification failed', 400)
  }

  const confirmedOrder = await confirmOnlineOrderPayment(
    order,
    {
      razorpayPaymentId,
      razorpaySignature,
      razorpayOrderId,
    },
    { clearCart: clearCart === true },
  )

  try {
    const downloads = await getOrderItemDownloads(confirmedOrder)
    await sendOrderLicenseEmail({ order: confirmedOrder, downloads })
  } catch (emailError) {
    console.error('[email] Failed to send license email:', emailError.message)
  }

  res.json({
    success: true,
    message: 'Payment verified successfully',
    data: { order: formatOrderResponse(confirmedOrder) },
  })
})

export const getPaymentConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      razorpayKeyId: getRazorpayKeyId(),
      currency: 'INR',
    },
  })
})
