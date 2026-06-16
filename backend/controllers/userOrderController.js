import asyncHandler from '../utils/asyncHandler.js'
import { formatOrderResponse } from '../utils/formatCart.js'
import { getOrdersForUser, getUserOrderById } from '../services/orderService.js'
import { getUserById } from '../services/userAuthService.js'

export const listUserOrders = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id)
  const orders = await getOrdersForUser(user._id, user.email)

  res.json({
    success: true,
    data: {
      orders: orders.map(formatOrderResponse),
    },
  })
})

export const getUserOrder = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id)
  const order = await getUserOrderById(user._id, user.email, req.params.id)

  res.json({
    success: true,
    data: {
      order: formatOrderResponse(order),
    },
  })
})
