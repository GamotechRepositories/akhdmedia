import asyncHandler from '../utils/asyncHandler.js'
import { formatOrderResponse } from '../utils/formatCart.js'
import {
  createPendingOnlineOrderFromCart,
  getAdminOrderById,
  getAllOrders,
  getCheckoutProfile,
  getOrderById,
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
import AppError from '../utils/AppError.js'
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

  const order = await createPendingOnlineOrderFromCart(req.sessionId, { billingAddress })
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
  const order = await getOrderById(req.sessionId, req.params.id)

  res.json({
    success: true,
    data: {
      order: formatOrderResponse(order),
    },
  })
})

export const getOrderDownloads = asyncHandler(async (req, res) => {
  const order = await getOrderById(req.sessionId, req.params.id)
  verifyOrderAccess(order, req.sessionId)

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
  const order = await getOrderById(req.sessionId, req.params.id)
  verifyOrderAccess(order, req.sessionId)

  if (!canAccessOrderDownloads(order)) {
    throw new AppError('Payment is required before license email can be sent', 402)
  }

  const downloads = await getOrderItemDownloads(order)
  const emailResult = await sendOrderLicenseEmail({ order, downloads })

  if (!emailResult.sent) {
    throw new AppError(`Could not send license email (${emailResult.reason})`, 500)
  }

  res.json({
    success: true,
    message: 'License email sent',
    data: { email: emailResult },
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
