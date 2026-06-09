import Category from '../models/Category.js'
import formatProduct, { buildCategoryMap } from './formatProduct.js'

export const getCategoryMap = async () => {
  const categories = await Category.find().lean()
  return buildCategoryMap(categories)
}

export const formatCartResponse = (cart, categoryMap) => {
  const items = (cart.items || []).map((item) => {
    const productDoc = item.product
    const formattedProduct =
      productDoc && productDoc._id
        ? formatProduct(productDoc, categoryMap)
        : null

    return {
      id: item._id.toString(),
      product: formattedProduct,
      productId: formattedProduct?.id || item.product?._id?.toString() || '',
      quantity: item.quantity,
      imageSize: item.imageSize || '',
      price: item.price,
    }
  })

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  )
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    id: cart._id?.toString() || '',
    items,
    total,
    itemCount,
  }
}

export const formatOrderResponse = (order) => ({
  id: order._id.toString(),
  orderNumber: order.orderNumber,
  items: order.items,
  billingAddress: order.billingAddress,
  paymentMethod: order.paymentMethod,
  totalAmount: order.totalAmount,
  status: order.status,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
})

export default formatCartResponse
