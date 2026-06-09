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

const REQUIRED_ADDRESS_FIELDS = ['name', 'email', 'phone', 'address', 'city']

const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

export const validateBillingAddress = (billingAddress = {}) => {
  const missing = REQUIRED_ADDRESS_FIELDS.filter((field) => !billingAddress[field]?.trim())

  if (missing.length > 0) {
    throw new AppError('Please fill in all required billing fields', 400)
  }

  const email = billingAddress.email.trim()
  if (!isValidEmail(email)) {
    throw new AppError('Please enter a valid email address', 400)
  }

  return {
    name: billingAddress.name.trim(),
    email,
    phone: billingAddress.phone.trim(),
    address: billingAddress.address.trim(),
    city: billingAddress.city.trim(),
    state: billingAddress.state?.trim() || '',
    zipCode: billingAddress.zipCode?.trim() || '',
    country: billingAddress.country?.trim() || 'India',
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

export const createOrderFromCart = async (
  sessionId,
  { billingAddress, paymentMethod = 'online' },
) => {
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

  const order = await Order.create({
    sessionId,
    orderNumber: buildOrderNumber(),
    items: orderItems,
    billingAddress: normalizedAddress,
    paymentMethod: paymentMethod === 'COD' ? 'COD' : 'online',
    totalAmount: total,
    status: 'confirmed',
  })

  await saveCheckoutProfile(sessionId, normalizedAddress)
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
