import Cart from '../models/Cart.js'
import Product from '../models/Product.js'
import { buildPayableTotals, roundMoney } from '../utils/money.js'
import {
  getListingPrice,
  resolveImageSizes,
} from '../utils/resolveImageSizes.js'
import { assertProductPurchasable } from '../utils/productDelivery.js'

const resolveItemPrice = (product, imageSize = '') => {
  const imageSizes = resolveImageSizes(product)

  if (imageSize && imageSizes[imageSize]) {
    return Number(imageSizes[imageSize].price)
  }

  return getListingPrice(product)
}

const getGstBreakdown = (basePrice, gstPercentage = 0) => {
  const normalizedBasePrice = Number(basePrice) || 0
  const normalizedGstPercentage = Number(gstPercentage) || 0
  const gstAmount = roundMoney((normalizedBasePrice * normalizedGstPercentage) / 100)
  return {
    basePrice: normalizedBasePrice,
    gstPercentage: normalizedGstPercentage,
    gstAmount,
    totalPrice: roundMoney(normalizedBasePrice + gstAmount),
  }
}

export const getOrCreateCart = async (sessionId) => {
  let cart = await Cart.findOne({ sessionId })

  if (!cart) {
    cart = await Cart.create({ sessionId, items: [] })
  }

  return cart
}

export const fetchPopulatedCart = async (sessionId) =>
  Cart.findOne({ sessionId }).populate({
    path: 'items.product',
    match: { isActive: true },
  })

const findMatchingItem = (cart, productId, imageSize) =>
  cart.items.find(
    (item) =>
      item.product.toString() === productId &&
      (item.imageSize || '') === (imageSize || ''),
  )

export const addCartItem = async (sessionId, { productId, quantity = 1, imageSize = '' }) => {
  const product = await Product.findOne({ _id: productId, isActive: true })

  if (!product) {
    throw new AppError('Product not found', 404)
  }

  assertProductPurchasable(product)

  const normalizedQuantity = Math.max(1, Number(quantity) || 1)
  const pricing = getGstBreakdown(resolveItemPrice(product, imageSize), product.gstPercentage)
  const cart = await getOrCreateCart(sessionId)
  const existingItem = findMatchingItem(cart, productId, imageSize)

  if (existingItem) {
    existingItem.quantity += normalizedQuantity
    existingItem.basePrice = pricing.basePrice
    existingItem.gstPercentage = pricing.gstPercentage
    existingItem.gstAmount = pricing.gstAmount
    existingItem.price = pricing.totalPrice
  } else {
    cart.items.push({
      product: productId,
      quantity: normalizedQuantity,
      imageSize: imageSize || '',
      basePrice: pricing.basePrice,
      gstPercentage: pricing.gstPercentage,
      gstAmount: pricing.gstAmount,
      price: pricing.totalPrice,
    })
  }

  await cart.save()
  return fetchPopulatedCart(sessionId)
}

export const updateCartItemQuantity = async (sessionId, itemId, quantity) => {
  const normalizedQuantity = Number(quantity)

  if (!Number.isFinite(normalizedQuantity) || normalizedQuantity < 1) {
    throw new AppError('Quantity must be at least 1', 400)
  }

  const cart = await getOrCreateCart(sessionId)
  const item = cart.items.id(itemId)

  if (!item) {
    throw new AppError('Cart item not found', 404)
  }

  item.quantity = normalizedQuantity
  await cart.save()
  return fetchPopulatedCart(sessionId)
}

export const removeCartItem = async (sessionId, itemId) => {
  const cart = await getOrCreateCart(sessionId)
  const item = cart.items.id(itemId)

  if (!item) {
    throw new AppError('Cart item not found', 404)
  }

  cart.items.pull(item._id)
  cart.markModified('items')
  await cart.save()
  return fetchPopulatedCart(sessionId)
}

export const replaceCartWithItem = async (sessionId, { productId, quantity = 1, imageSize = '' }) => {
  const product = await Product.findOne({ _id: productId, isActive: true })

  if (!product) {
    throw new AppError('Product not found', 404)
  }

  assertProductPurchasable(product)

  const normalizedQuantity = Math.max(1, Number(quantity) || 1)
  const pricing = getGstBreakdown(resolveItemPrice(product, imageSize), product.gstPercentage)
  const cart = await getOrCreateCart(sessionId)

  cart.items = [
    {
      product: productId,
      quantity: normalizedQuantity,
      imageSize: imageSize || '',
      basePrice: pricing.basePrice,
      gstPercentage: pricing.gstPercentage,
      gstAmount: pricing.gstAmount,
      price: pricing.totalPrice,
    },
  ]

  await cart.save()
  return fetchPopulatedCart(sessionId)
}

export const clearCartItems = async (sessionId) => {
  const cart = await getOrCreateCart(sessionId)
  cart.items = []
  await cart.save()
  return cart
}

export const getCartTotals = (items = []) => {
  const raw = items.reduce(
    (acc, item) => {
      acc.subtotal += (item.basePrice ?? item.price ?? 0) * item.quantity
      acc.gstTotal += (item.gstAmount ?? 0) * item.quantity
      acc.itemCount += item.quantity
      return acc
    },
    { subtotal: 0, gstTotal: 0, itemCount: 0 },
  )

  return {
    ...buildPayableTotals(raw),
    itemCount: raw.itemCount,
  }
}
