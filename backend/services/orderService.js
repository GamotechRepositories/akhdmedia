import Order from '../models/Order.js'
import Product from '../models/Product.js'
import CheckoutProfile from '../models/CheckoutProfile.js'
import AppError from '../utils/AppError.js'
import { generateClipId, generateLicenseNumber } from '../utils/licenseIds.js'
import formatProduct from '../utils/formatProduct.js'
import { formatOrderResponse, getCategoryMap } from '../utils/formatCart.js'
import {
  clearCartItems,
  fetchPopulatedCart,
  getCartTotals,
} from './cartService.js'
import { assertProductPurchasable, hasDeliverableMasterFile } from '../utils/productDelivery.js'

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
    throw new AppError('Please select where you will use the video', 400)
  }
  if (purchaseReasons.length > 1) {
    throw new AppError('Please select only one usage option', 400)
  }

  const purchaseReasonOther = String(billingAddress.purchaseReasonOther || '').trim()

  if (purchaseReasons.includes('other') && !purchaseReasonOther) {
    throw new AppError('Please describe how you will use the video', 400)
  }

  return {
    name: billingAddress.name.trim(),
    email,
    phone: billingAddress.phone.trim(),
    purchaseReasons,
    purchaseReasonOther: purchaseReasons.includes('other') ? purchaseReasonOther : '',
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

const ensureProductClipId = async (productDoc) => {
  if (productDoc?.clipId) {
    return productDoc.clipId
  }

  const clipId = await generateClipId()
  await Product.findByIdAndUpdate(productDoc._id, { clipId })
  return clipId
}

const buildOrderPayloadFromCart = async (sessionId, billingAddress) => {
  const normalizedAddress = validateBillingAddress(billingAddress)
  const cart = await fetchPopulatedCart(sessionId)

  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty', 400)
  }

  const categoryMap = await getCategoryMap()
  const filteredItems = cart.items.filter((item) => item.product)
  const orderItems = await Promise.all(
    filteredItems.map(async (item) => {
      assertProductPurchasable(item.product)
      const clipId = await ensureProductClipId(item.product)
      const product = formatProduct(item.product, categoryMap)
      const lineTotal = item.price * item.quantity

      return {
        productId: product.id,
        clipId,
        licenseNumber: '',
        name: product.name,
        brand: product.brand || '',
        imageSize: item.imageSize || '',
        image: product.images?.[0] || product.videoPoster || '',
        quantity: item.quantity,
        price: item.price,
        lineTotal,
      }
    }),
  )

  if (orderItems.length === 0) {
    throw new AppError('No valid items found in cart', 400)
  }

  const { total } = getCartTotals(cart.items)

  return { normalizedAddress, orderItems, total }
}

export const createPendingOnlineOrderFromCart = async (sessionId, { billingAddress, userId = null }) => {
  const { normalizedAddress, orderItems, total } = await buildOrderPayloadFromCart(
    sessionId,
    billingAddress,
  )

  const order = await Order.create({
    sessionId,
    userId: userId || null,
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
  order,
  { razorpayPaymentId, razorpaySignature, razorpayOrderId },
  { clearCart = true } = {},
) => {
  if (!order) {
    throw new AppError('Order not found', 404)
  }

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

  order.items.forEach((item) => {
    if (!item.licenseNumber) {
      item.licenseNumber = generateLicenseNumber()
    }
  })
  order.markModified('items')

  await order.save()

  if (clearCart) {
    await clearCartItems(order.sessionId)
  }

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

const buildUserOrderFilter = (userId, email) => ({
  $or: [
    { userId },
    {
      $and: [
        { $or: [{ userId: null }, { userId: { $exists: false } }] },
        { 'billingAddress.email': email },
      ],
    },
  ],
})

export const getOrdersForUser = async (userId, email) => {
  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail) {
    throw new AppError('User email is required', 400)
  }

  return Order.find(buildUserOrderFilter(userId, normalizedEmail)).sort({ createdAt: -1 })
}

export const getUserOrderById = async (userId, email, orderId) => {
  const normalizedEmail = email?.trim().toLowerCase()
  const order = await Order.findOne({
    _id: orderId,
    ...buildUserOrderFilter(userId, normalizedEmail),
  })

  if (!order) {
    throw new AppError('Order not found', 404)
  }

  return order
}

export const resolveAccessibleOrder = async ({ sessionId, userId, userEmail, orderId }) => {
  if (userId && userEmail) {
    return getUserOrderById(userId, userEmail, orderId)
  }

  if (sessionId) {
    return getOrderById(sessionId, orderId)
  }

  throw new AppError('Order not found', 404)
}

const getUnavailableItemReason = (product) => {
  if (!product) {
    return 'This product has been removed and is no longer available.'
  }

  if (!product.isActive) {
    return 'This product is no longer available for purchase.'
  }

  if (!hasDeliverableMasterFile(product)) {
    return 'The delivery file for this product is not available right now.'
  }

  return ''
}

export const validatePendingOrderItemsPurchasable = async (order) => {
  const unavailableItems = []

  for (const item of order.items || []) {
    const product = await Product.findById(item.productId)
    const reason = getUnavailableItemReason(product)

    if (reason) {
      unavailableItems.push({
        productId: item.productId,
        name: item.name,
        reason,
      })
    }
  }

  const canPay = unavailableItems.length === 0
  const paymentBlockReason = canPay
    ? ''
    : unavailableItems
        .map((item) => `${item.name}: ${item.reason}`)
        .join(' ')

  return {
    canPay,
    canResumePayment: canPay,
    unavailableItems,
    paymentBlockReason,
  }
}

export const enrichOrderWithPaymentResumeStatus = async (order) => {
  const formatted = formatOrderResponse(order)

  if (order.paymentStatus !== 'pending' || order.status !== 'pending') {
    return {
      ...formatted,
      canResumePayment: false,
      unavailableItems: [],
      paymentBlockReason: '',
    }
  }

  const validation = await validatePendingOrderItemsPurchasable(order)

  return {
    ...formatted,
    ...validation,
  }
}
