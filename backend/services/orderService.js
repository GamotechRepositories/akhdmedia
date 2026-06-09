import Order from '../models/Order.js'
import CheckoutProfile from '../models/CheckoutProfile.js'
import AppError from '../utils/AppError.js'
import {
  clearCartItems,
  fetchPopulatedCart,
  getCartTotals,
} from './cartService.js'
import formatProduct from '../utils/formatProduct.js'
import { getCategoryMap } from '../utils/formatCart.js'

const REQUIRED_BILLING_FIELDS = ['name', 'email', 'phone']

const VALID_PURCHASE_REASONS = new Set(['personal', 'digital', 'outlet', 'other'])

const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

export const validateBillingAddress = (billingAddress = {}) => {
  const missing = REQUIRED_BILLING_FIELDS.filter((field) => !billingAddress[field]?.trim())

  if (missing.length > 0) {
    throw new AppError('Please fill in all required billing fields', 400)
  }

  const email = billingAddress.email.trim()
  if (!isValidEmail(email)) {
    throw new AppError('Please enter a valid email address', 400)
  }

  const purchaseReasons = [...new Set((billingAddress.purchaseReasons || []).map(String))]
    .map((reason) => reason.trim())
    .filter((reason) => VALID_PURCHASE_REASONS.has(reason))

  if (!purchaseReasons.length) {
    throw new AppError('Please select why you are purchasing this video', 400)
  }

  return {
    name: billingAddress.name.trim(),
    email,
    phone: billingAddress.phone.trim(),
    purchaseReasons,
  }
}

const buildOrderNumber = () => {
  const suffix = Math.floor(Math.random() * 9000 + 1000)
  return `FV${Date.now()}${suffix}`
}

export const getCheckoutProfile = async (sessionId) =>
  CheckoutProfile.findOne({ sessionId }).lean()

export const saveCheckoutProfile = async (sessionId, billingAddress) => {
  const normalizedAddress = validateBillingAddress(billingAddress)

  const profile = await CheckoutProfile.findOneAndUpdate(
    { sessionId },
    { billingAddress: normalizedAddress },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )

  return profile.billingAddress
}

const buildOrderPayloadFromCart = async (sessionId, billingAddress) => {
  const normalizedAddress = validateBillingAddress(billingAddress)
  const cart = await fetchPopulatedCart(sessionId)

  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400)
  }

  const categoryMap = await getCategoryMap()
  const orderItems = cart.items
    .filter((item) => item.product)
    .map((item) => {
      const product = formatProduct(item.product, categoryMap)
      const lineTotal = item.price * item.quantity

      return {
        productId: product.id,
        name: product.name,
        brand: product.brand || '',
        imageSize: item.imageSize || '',
        image: product.images?.[0] || product.videoPoster || '',
        quantity: item.quantity,
        price: item.price,
        lineTotal,
      }
    })

  if (orderItems.length === 0) {
    throw new AppError('No valid items found in cart', 400)
  }

  const { total } = getCartTotals(cart.items)

  return { normalizedAddress, orderItems, total }
}

export const createOrderFromCart = async (
  sessionId,
  { billingAddress, paymentMethod = 'online' },
) => {
  const { normalizedAddress, orderItems, total } = await buildOrderPayloadFromCart(
    sessionId,
    billingAddress,
  )

  const order = await Order.create({
    sessionId,
    orderNumber: buildOrderNumber(),
    items: orderItems,
    billingAddress: normalizedAddress,
    paymentMethod: 'COD',
    totalAmount: total,
    paymentStatus: 'invoice',
    status: 'confirmed',
  })

  await saveCheckoutProfile(sessionId, normalizedAddress)
  await clearCartItems(sessionId)

  return order
}

export const createPendingOnlineOrderFromCart = async (sessionId, { billingAddress }) => {
  const { normalizedAddress, orderItems, total } = await buildOrderPayloadFromCart(
    sessionId,
    billingAddress,
  )

  const order = await Order.create({
    sessionId,
    orderNumber: buildOrderNumber(),
    items: orderItems,
    billingAddress: normalizedAddress,
    paymentMethod: 'online',
    totalAmount: total,
    paymentStatus: 'pending',
    status: 'pending',
  })

  await saveCheckoutProfile(sessionId, normalizedAddress)

  return order
}

export const confirmOnlineOrderPayment = async (
  sessionId,
  orderId,
  { razorpayPaymentId, razorpaySignature, razorpayOrderId },
) => {
  const order = await getOrderById(sessionId, orderId)

  if (order.paymentMethod !== 'online') {
    throw new AppError('This order does not require online payment', 400)
  }

  if (order.paymentStatus === 'paid') {
    return order
  }

  order.paymentStatus = 'paid'
  order.status = 'confirmed'
  order.razorpayPaymentId = razorpayPaymentId
  order.razorpaySignature = razorpaySignature
  if (razorpayOrderId) {
    order.razorpayOrderId = razorpayOrderId
  }

  await order.save()
  await clearCartItems(sessionId)

  return order
}

export const getOrderById = async (sessionId, orderId) => {
  const order = await Order.findOne({ _id: orderId, sessionId })

  if (!order) {
    throw new AppError('Order not found', 404)
  }

  return order
}

export const getAllOrders = async () => Order.find().sort({ createdAt: -1 })

export const getAdminOrderById = async (orderId) => {
  const order = await Order.findById(orderId)

  if (!order) {
    throw new AppError('Order not found', 404)
  }

  return order
}
