import asyncHandler from '../utils/asyncHandler.js'
import { formatOrderResponse } from '../utils/formatCart.js'
import { confirmOnlineOrderPayment, getOrderById } from '../services/orderService.js'
import { getOrderItemDownloads } from '../services/downloadService.js'
import { sendOrderLicenseEmail } from '../services/emailService.js'
import {
  getRazorpayKeyId,
  verifyRazorpaySignature,
} from '../services/paymentService.js'
import AppError from '../utils/AppError.js'

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    orderId,
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = req.body

  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError('Missing payment verification details', 400)
  }

  const order = await getOrderById(req.sessionId, orderId)

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

  const confirmedOrder = await confirmOnlineOrderPayment(req.sessionId, orderId, {
    razorpayPaymentId,
    razorpaySignature,
    razorpayOrderId,
  })

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
