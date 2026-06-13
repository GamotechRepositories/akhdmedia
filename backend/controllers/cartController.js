import asyncHandler from '../utils/asyncHandler.js'
import {
  formatCartResponse,
  getCategoryMap,
  formatOrderResponse,
} from '../utils/formatCart.js'
import {
  addCartItem,
  clearCartItems,
  fetchPopulatedCart,
  removeCartItem,
  replaceCartWithItem,
  updateCartItemQuantity,
} from '../services/cartService.js'

export const getCart = asyncHandler(async (req, res) => {
  const cart = await fetchPopulatedCart(req.sessionId)
  const categoryMap = await getCategoryMap()

  res.json({
    success: true,
    data: {
      cart: formatCartResponse(cart || { items: [] }, categoryMap),
    },
  })
})

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, imageSize = '' } = req.body

  if (!productId) {
    res.status(400).json({ success: false, message: 'Product ID is required' })
    return
  }

  const cart = await addCartItem(req.sessionId, { productId, quantity, imageSize })
  const categoryMap = await getCategoryMap()

  res.status(201).json({
    success: true,
    message: 'Item added to cart',
    data: {
      cart: formatCartResponse(cart, categoryMap),
    },
  })
})

export const buyNow = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, imageSize = '' } = req.body

  if (!productId) {
    res.status(400).json({ success: false, message: 'Product ID is required' })
    return
  }

  const cart = await replaceCartWithItem(req.sessionId, { productId, quantity, imageSize })
  const categoryMap = await getCategoryMap()

  res.json({
    success: true,
    message: 'Ready for checkout',
    data: {
      cart: formatCartResponse(cart, categoryMap),
    },
  })
})

export const updateCartItem = asyncHandler(async (req, res) => {
  const cart = await updateCartItemQuantity(
    req.sessionId,
    req.params.itemId,
    req.body.quantity,
  )
  const categoryMap = await getCategoryMap()

  res.json({
    success: true,
    data: {
      cart: formatCartResponse(cart, categoryMap),
    },
  })
})

export const deleteCartItem = asyncHandler(async (req, res) => {
  const cart = await removeCartItem(req.sessionId, req.params.itemId)
  const categoryMap = await getCategoryMap()

  res.json({
    success: true,
    data: {
      cart: formatCartResponse(cart, categoryMap),
    },
  })
})

export const clearCart = asyncHandler(async (req, res) => {
  await clearCartItems(req.sessionId)
  const categoryMap = await getCategoryMap()

  res.json({
    success: true,
    data: {
      cart: formatCartResponse({ items: [] }, categoryMap),
    },
  })
})
