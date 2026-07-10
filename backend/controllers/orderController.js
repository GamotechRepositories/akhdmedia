import asyncHandler from '../utils/asyncHandler.js'
import Order from '../models/Order.js'
import { formatOrderResponse } from '../utils/formatCart.js'
import { buildPaginationMeta, parsePageLimit } from '../utils/pagination.js'
import { buildOrderListFilter } from '../utils/orderFilters.js'
import {
  createPendingOnlineOrderFromCart,
  deleteAdminOrderById,
  getAdminOrderById,
  getAllOrders,
  getCheckoutProfile,
  resolveAccessibleOrder,
  saveCheckoutProfile,
  validatePendingOrderItemsPurchasable,
  enrichOrderWithPaymentResumeStatus,
} from '../services/orderService.js'
import {
  getOrderItemDownloads,
  verifyOrderAccess,
} from '../services/downloadService.js'
import {
  canAccessOrderDownloads,
  createRazorpayOrder,
  getRazorpayKeyId,
  isPayPalConfigured,
  isRazorpayConfigured,
} from '../services/paymentService.js'
import { createPayPalOrder } from '../services/paypalService.js'
import { sendOrderLicenseEmail } from '../services/emailService.js'
import {
  buildLicenseCertificateBuffer,
  getLicenseCertificateFilename,
} from '../services/licenseCertificateService.js'
import { readLicenseAgreementBuffer, LICENSE_AGREEMENT_FILENAME } from '../utils/licenseDocuments.js'
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
    const order = await resolveAccessibleOrder({
      sessionId: req.sessionId,
      userId: user._id,
      userEmail: user.email,
      orderId,
    })
    return { order, userEmail: user.email }
  }

  if (!req.sessionId) {
    throw new AppError('Order not found', 404)
  }

  const order = await resolveAccessibleOrder({
    sessionId: req.sessionId,
    orderId,
  })
  return { order, userEmail: null }
}

const resolvePaymentProvider = (value = '') =>
  String(value).toLowerCase() === 'paypal' ? 'paypal' : 'razorpay'

const buildPaymentSession = async (order, paymentProvider) => {
  if (paymentProvider === 'paypal') {
    if (!isPayPalConfigured()) {
      throw new AppError('PayPal is not available right now', 503)
    }

    const paypalOrder = await createPayPalOrder({
      amount: order.totalAmount,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    })

    order.paypalOrderId = paypalOrder.id
    order.razorpayOrderId = ''
    await order.save()

    return {
      paypal: {
        orderId: paypalOrder.id,
        approvalUrl: paypalOrder.approvalUrl,
        currency: paypalOrder.currency,
        amount: paypalOrder.amount,
        inrAmount: paypalOrder.inrAmount,
        usdInrRate: paypalOrder.usdInrRate,
        rateSource: paypalOrder.rateSource,
      },
    }
  }

  if (!isRazorpayConfigured()) {
    throw new AppError('Razorpay is not available right now', 503)
  }

  const razorpayOrder = await createRazorpayOrder({
    amount: order.totalAmount,
    receipt: order.orderNumber,
    notes: {
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
    },
  })

  order.razorpayOrderId = razorpayOrder.id
  order.paypalOrderId = ''
  await order.save()

  return {
    razorpay: {
      keyId: getRazorpayKeyId(),
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    },
  }
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

  const paymentProvider = resolvePaymentProvider(req.body.paymentProvider)
  if (paymentProvider === 'razorpay' && !isRazorpayConfigured()) {
    throw new AppError('Razorpay is not available right now', 503)
  }
  if (paymentProvider === 'paypal' && !isPayPalConfigured()) {
    throw new AppError('PayPal is not available right now', 503)
  }

  const order = await createPendingOnlineOrderFromCart(req.sessionId, {
    billingAddress,
    userId: req.user?.id || null,
    paymentProvider,
  })
  const paymentSession = await buildPaymentSession(order, paymentProvider)

  res.status(201).json({
    success: true,
    message: 'Proceed to payment',
    data: {
      order: formatOrderResponse(order),
      ...paymentSession,
    },
  })
})

export const getOrder = asyncHandler(async (req, res) => {
  const { order } = await resolveOrderForRequest(req, req.params.id)

  res.json({
    success: true,
    data: {
      order: await enrichOrderWithPaymentResumeStatus(order),
    },
  })
})

export const resumeOrderPayment = asyncHandler(async (req, res) => {
  const { order } = await resolveOrderForRequest(req, req.params.id)

  if (order.paymentMethod !== 'online') {
    throw new AppError('This order does not require online payment', 400)
  }

  if (order.paymentStatus === 'paid') {
    throw new AppError('This order is already paid', 400)
  }

  if (order.status !== 'pending' || order.paymentStatus !== 'pending') {
    throw new AppError('This order cannot be paid', 400)
  }

  const validation = await validatePendingOrderItemsPurchasable(order)
  if (!validation.canPay) {
    throw new AppError(
      validation.paymentBlockReason ||
        'One or more items in this order are no longer available for payment.',
      400,
    )
  }

  const paymentProvider = order.paymentProvider || 'razorpay'
  const paymentSession = await buildPaymentSession(order, paymentProvider)

  res.json({
    success: true,
    message: 'Proceed to payment',
    data: {
      order: await enrichOrderWithPaymentResumeStatus(order),
      ...paymentSession,
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

export const downloadLicenseCertificate = asyncHandler(async (req, res) => {
  const { order, userEmail } = await resolveOrderForRequest(req, req.params.id)
  verifyOrderAccess(order, req.sessionId, req.user?.id, userEmail)

  if (!canAccessOrderDownloads(order)) {
    throw new AppError('Payment is required before license certificate is available', 402)
  }

  const downloads = await getOrderItemDownloads(order)
  const buffer = buildLicenseCertificateBuffer(order, downloads)
  const filename = getLicenseCertificateFilename(order)

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(buffer)
})

export const downloadLicenseAgreement = asyncHandler(async (req, res) => {
  const { order, userEmail } = await resolveOrderForRequest(req, req.params.id)
  verifyOrderAccess(order, req.sessionId, req.user?.id, userEmail)

  if (!canAccessOrderDownloads(order)) {
    throw new AppError('Payment is required before license agreement is available', 402)
  }

  const buffer = await readLicenseAgreementBuffer()

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${LICENSE_AGREEMENT_FILENAME}"`)
  res.send(buffer)
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
  const pagination = parsePageLimit(req.query)

  if (pagination) {
    const { page, limit, skip } = pagination
    const filter = {
      ...buildOrderListFilter(req.query),
      paymentStatus: 'paid',
    }

    const [orders, total, grandTotal] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
      Order.countDocuments({ paymentStatus: 'paid' }),
    ])

    res.json({
      success: true,
      data: {
        orders: orders.map(formatOrderResponse),
        pagination: buildPaginationMeta(page, limit, total),
        meta: { grandTotal },
      },
    })
    return
  }

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

export const deleteAdminOrder = asyncHandler(async (req, res) => {
  await deleteAdminOrderById(req.params.id)

  res.json({
    success: true,
    message: 'Order deleted successfully',
  })
})
