import Category from '../models/Category.js'
import { buildPayableTotals } from './money.js'
import formatProduct, { buildCategoryMap } from './formatProduct.js'
import {
  getLicenseResendWindowEndsAt,
  isLicenseResendWindowOpen,
  LICENSE_EMAIL_RESEND_WINDOW_MS,
  MAX_LICENSE_EMAIL_RESENDS,
} from '../config/email.js'

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
      basePrice: item.basePrice ?? item.price ?? 0,
      gstPercentage: item.gstPercentage ?? formattedProduct?.gstPercentage ?? 0,
      gstAmount: item.gstAmount ?? 0,
      price: item.price,
    }
  })

  const subtotal = items.reduce((sum, item) => sum + item.basePrice * item.quantity, 0)
  const rawGstTotal = items.reduce((sum, item) => sum + item.gstAmount * item.quantity, 0)
  const { gstTotal, total } = buildPayableTotals({ subtotal, gstTotal: rawGstTotal })
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    id: cart._id?.toString() || '',
    items,
    subtotal,
    gstTotal,
    total,
    itemCount,
  }
}

export const formatOrderResponse = (order) => {
  const licenseEmailResendCount = order.licenseEmailResendCount || 0
  const resendsRemaining = Math.max(0, MAX_LICENSE_EMAIL_RESENDS - licenseEmailResendCount)
  const resendWindowOpen = isLicenseResendWindowOpen(order.createdAt)

  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    items: order.items,
    billingAddress: order.billingAddress,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus || '',
    subtotalAmount: order.subtotalAmount ?? 0,
    gstAmount: order.gstAmount ?? 0,
    totalAmount: order.totalAmount,
    status: order.status,
    razorpayOrderId: order.razorpayOrderId || '',
    razorpayPaymentId: order.razorpayPaymentId || '',
    licenseEmailResendCount,
    maxLicenseEmailResends: MAX_LICENSE_EMAIL_RESENDS,
    licenseEmailResendsRemaining: resendsRemaining,
    licenseEmailResendWindowMs: LICENSE_EMAIL_RESEND_WINDOW_MS,
    licenseEmailResendWindowEndsAt: getLicenseResendWindowEndsAt(order.createdAt).toISOString(),
    isLicenseEmailResendWindowOpen: resendWindowOpen,
    canResendLicenseEmail: resendWindowOpen && resendsRemaining > 0,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}

export default formatCartResponse
