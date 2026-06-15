import Category from '../models/Category.js'
import formatProduct, { buildCategoryMap } from './formatProduct.js'
import { MAX_LICENSE_EMAIL_RESENDS } from '../config/email.js'

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

export const formatOrderResponse = (order) => {
  const licenseEmailResendCount = order.licenseEmailResendCount || 0

  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    items: order.items,
    billingAddress: order.billingAddress,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus || '',
    totalAmount: order.totalAmount,
    status: order.status,
    razorpayOrderId: order.razorpayOrderId || '',
    razorpayPaymentId: order.razorpayPaymentId || '',
    licenseEmailResendCount,
    maxLicenseEmailResends: MAX_LICENSE_EMAIL_RESENDS,
    licenseEmailResendsRemaining: Math.max(0, MAX_LICENSE_EMAIL_RESENDS - licenseEmailResendCount),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

export default formatCartResponse
