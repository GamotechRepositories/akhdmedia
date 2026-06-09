import asyncHandler from '../utils/asyncHandler.js'
import { formatOrderResponse } from '../utils/formatCart.js'
import {
  createOrderFromCart,
  getCheckoutProfile,
  getOrderById,
  saveCheckoutProfile,
} from '../services/orderService.js'
import {
  getOrderItemDownloads,
  verifyOrderAccess,
} from '../services/downloadService.js'
import { queueOrderConfirmationEmail } from '../services/orderEmailService.js'

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
  const { billingAddress, paymentMethod } = req.body
  const order = await createOrderFromCart(req.sessionId, {
    billingAddress,
    paymentMethod,
  })

  queueOrderConfirmationEmail(order)

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: {
      order: formatOrderResponse(order),
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
  const downloads = await getOrderItemDownloads(order)

  res.json({
    success: true,
    data: { downloads },
  })
})
