import asyncHandler from '../utils/asyncHandler.js'
import { formatOrderResponse } from '../utils/formatCart.js'
import {
  createPendingOnlineOrderFromCart,
  getAdminOrderById,
  getAllOrders,
  getCheckoutProfile,
  getOrderById,
  getUserOrderById,
  saveCheckoutProfile,
} from '../services/orderService.js'
import {
  getOrderItemDownloads,
  verifyOrderAccess,
} from '../services/downloadService.js'
import {
  canAccessOrderDownloads,
  createRazorpayOrder,
  getRazorpayKeyId,
} from '../services/paymentService.js'
import { sendOrderLicenseEmail } from '../services/emailService.js'
import {
  LICENSE_EMAIL_RESEND_LIMIT_MESSAGE,
  LICENSE_EMAIL_RESEND_WINDOW_EXPIRED_MESSAGE,
  MAX_LICENSE_EMAIL_RESENDS,
  isLicenseResendWindowOpen,
} from '../config/email.js'
import AppError from '../utils/AppError.js'
import { getUserById } from '../services/userAuthService.js'

const resolveOrderForRequest = async (req, orderId) => {
  if (req.user?.id) {
    const user = await getUserById(req.user.id)
    const order = await getUserOrderById(user._id, user.email, orderId)
    return { order, userEmail: user.email }
  }

  if (!req.sessionId) {
    throw new AppError('Order not found', 404)
  }

  const order = await getOrderById(req.sessionId, orderId)
  return { order, userEmail: null }
}
export const getProfile = asyncHandler(async (req, res) => {
  const profile = await getCheckoutProfile(req.sessionId)

  res.json({
    success: true,
    data: {
      billingAddress: profile?.billingAddress || null,
    },
  })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const billingAddress = await saveCheckoutProfile(req.sessionId, req.body)

  res.json({
    success: true,
    message: 'Billing address saved',
    data: { billingAddress },
  })
})

export const createOrder = asyncHandler(async (req, res) => {
  const { billingAddress } = req.body

  if (req.body.paymentMethod === 'COD') {
    throw new AppError('COD payment is not available', 400)
  }

  const order = await createPendingOnlineOrderFromCart(req.sessionId, {
    billingAddress,
    userId: req.user?.id || null,
  })
  const razorpayOrder = await createRazorpayOrder({
    amount: order.totalAmount,
    receipt: order.orderNumber,
    notes: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    },
  })

  order.razorpayOrderId = razorpayOrder.id
  await order.save()

  res.status(201).json({
    success: true,
    message: 'Proceed to payment',
    data: {
      order: formatOrderResponse(order),
      razorpay: {
        keyId: getRazorpayKeyId(),
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
    },
  })
})

export const getOrder = asyncHandler(async (req, res) => {
  const { order } = await resolveOrderForRequest(req, req.params.id)

  res.json({
    success: true,
    data: {
      order: formatOrderResponse(order),
    },
  })
})

export const getOrderDownloads = asyncHandler(async (req, res) => {
  const { order, userEmail } = await resolveOrderForRequest(req, req.params.id)
  verifyOrderAccess(order, req.sessionId, req.user?.id, userEmail)

  if (!canAccessOrderDownloads(order)) {
    throw new AppError('Payment is required before downloads are available', 402)
  }

  const downloads = await getOrderItemDownloads(order)

  res.json({
    success: true,
    data: { downloads },
  })
})

export const resendOrderLicenseEmail = asyncHandler(async (req, res) => {
  const { order, userEmail } = await resolveOrderForRequest(req, req.params.id)
  verifyOrderAccess(order, req.sessionId, req.user?.id, userEmail)

  if (!canAccessOrderDownloads(order)) {
    throw new AppError('Payment is required before license email can be sent', 402)
  }

  if ((order.licenseEmailResendCount || 0) >= MAX_LICENSE_EMAIL_RESENDS) {
    throw new AppError(LICENSE_EMAIL_RESEND_LIMIT_MESSAGE, 429)
  }

  if (!isLicenseResendWindowOpen(order.createdAt)) {
    throw new AppError(LICENSE_EMAIL_RESEND_WINDOW_EXPIRED_MESSAGE, 429)
  }

  const downloads = await getOrderItemDownloads(order)
  const emailResult = await sendOrderLicenseEmail({ order, downloads })

  if (!emailResult.sent) {
    throw new AppError(`Could not send license email (${emailResult.reason})`, 500)
  }

  order.licenseEmailResendCount = (order.licenseEmailResendCount || 0) + 1
  await order.save()

  res.json({
    success: true,
    message: 'License email sent',
    data: {
      email: emailResult,
      order: formatOrderResponse(order),
    },
  })
})

export const listAdminOrders = asyncHandler(async (req, res) => {
  const orders = await getAllOrders()

  res.json({
    success: true,
    data: {
      orders: orders.map(formatOrderResponse),
    },
  })
})

export const getAdminOrder = asyncHandler(async (req, res) => {
  const order = await getAdminOrderById(req.params.id)

  res.json({
    success: true,
    data: {
      order: formatOrderResponse(order),
    },
  })
})
