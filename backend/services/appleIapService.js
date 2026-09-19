import { PURCHASE_TYPES, buildAppleProductId } from '../constants/purchaseTypes.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import AppError from '../utils/AppError.js'
import formatProduct, { buildCategoryMap } from '../utils/formatProduct.js'
import { getListingPrice, resolveImageSizes } from '../utils/resolveImageSizes.js'
import { assertProductPurchasable } from '../utils/productDelivery.js'
import { generateClipId, generateLicenseNumber } from '../utils/licenseIds.js'
import Category from '../models/Category.js'
import { applyPayableLineTotals } from '../utils/orderAmounts.js'
import { confirmOnlineOrderPayment, validateBillingAddress } from './orderService.js'

const PRODUCTION_VERIFY_URL = 'https://buy.itunes.apple.com/verifyReceipt'
const SANDBOX_VERIFY_URL = 'https://sandbox.itunes.apple.com/verifyReceipt'

const getAppleSharedSecret = () => process.env.APPLE_IAP_SHARED_SECRET?.trim() || ''

export const isAppleIapVerificationConfigured = () => Boolean(getAppleSharedSecret())

const buildOrderNumber = () => {
  const suffix = Math.floor(Math.random() * 9000 + 1000)
  return `FV${Date.now()}${suffix}`
}

const postAppleReceipt = async (url, receiptData) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receiptData,
      password: getAppleSharedSecret(),
      'exclude-old-transactions': true,
    }),
  })

  if (!response.ok) {
    throw new AppError(`Apple receipt verification HTTP ${response.status}`, 502)
  }

  return response.json()
}

/**
 * Verify App Store receipt against Apple production.
 * Sandbox fallback (status 21007) is kept only for TestFlight / sandbox Apple IDs —
 * local StoreKit Configuration testing is disabled.
 */
export const verifyAppleReceipt = async ({
  receiptData = '',
  appleProductId = '',
  transactionId = '',
} = {}) => {
  if (!getAppleSharedSecret()) {
    throw new AppError(
      'Apple IAP shared secret is not configured (APPLE_IAP_SHARED_SECRET)',
      503,
    )
  }

  if (!receiptData?.trim()) {
    throw new AppError('Missing Apple receipt data', 400)
  }

  if (!transactionId?.trim()) {
    throw new AppError('Missing Apple transaction id', 400)
  }

  let payload = await postAppleReceipt(PRODUCTION_VERIFY_URL, receiptData.trim())
  let environment = 'Production'

  // 21007 = receipt is from the sandbox (TestFlight / sandbox Apple ID)
  if (payload.status === 21007) {
    payload = await postAppleReceipt(SANDBOX_VERIFY_URL, receiptData.trim())
    environment = 'Sandbox'
  }

  if (payload.status !== 0) {
    throw new AppError(`Apple receipt invalid (status ${payload.status})`, 400)
  }

  const candidates = [
    ...(payload.latest_receipt_info || []),
    ...(payload.receipt?.in_app || []),
  ]

  const match =
    candidates.find((entry) => entry.transaction_id === transactionId) ||
    candidates.find((entry) => entry.product_id === appleProductId) ||
    candidates[0]

  if (!match) {
    throw new AppError('Apple receipt does not contain a matching purchase', 400)
  }

  if (appleProductId && match.product_id && match.product_id !== appleProductId) {
    throw new AppError('Apple product id mismatch', 400)
  }

  return {
    verified: true,
    mode: 'apple_verify_receipt',
    environment,
    transactionId: match.transaction_id || transactionId,
    originalTransactionId:
      match.original_transaction_id || match.transaction_id || transactionId,
    productId: match.product_id || appleProductId,
  }
}

const resolveTierPrice = (product, imageSize = '') => {
  const sizes = resolveImageSizes(product)
  const selected = imageSize && sizes[imageSize] ? sizes[imageSize] : null
  const price = Number(selected?.price ?? getListingPrice(product) ?? product.price) || 0
  const gstPercentage = Number(product.gstPercentage) || 0
  const gstAmount = Math.round(((price * gstPercentage) / 100) * 100) / 100
  return {
    imageSize: selected ? imageSize : Object.keys(sizes)[0] || imageSize || '',
    basePrice: price,
    gstPercentage,
    gstAmount,
    price: Math.round((price + gstAmount) * 100) / 100,
  }
}

export const createPaidOrderFromApplePurchase = async ({
  sessionId,
  userId,
  productId,
  appleProductId,
  transactionId,
  originalTransactionId = '',
  receiptData = '',
  imageSize = '',
  billingAddress = {},
} = {}) => {
  if (!sessionId) {
    throw new AppError('Session is required', 400)
  }
  if (!userId) {
    throw new AppError('Sign in required for Apple purchases', 401)
  }
  if (!transactionId?.trim()) {
    throw new AppError('Missing Apple transaction id', 400)
  }

  const existing = await Order.findOne({
    appleTransactionId: transactionId.trim(),
    paymentStatus: 'paid',
  })
  if (existing) {
    return existing
  }

  const product = await Product.findById(productId)
  if (!product || product.isActive === false) {
    throw new AppError('Product not found', 404)
  }

  const expectedAppleId =
    product.appleProductId || buildAppleProductId(product._id, product.mediaType)

  if (appleProductId && expectedAppleId && appleProductId !== expectedAppleId) {
    throw new AppError('Apple product id does not match this catalog item', 400)
  }

  // Auto-heal older catalog rows that predate APPLE_IAP tagging.
  if (product.purchaseType !== PURCHASE_TYPES.APPLE_IAP || !product.appleProductId) {
    product.purchaseType = PURCHASE_TYPES.APPLE_IAP
    product.appleProductId = expectedAppleId
    await product.save()
  }

  assertProductPurchasable(product)

  const verification = await verifyAppleReceipt({
    receiptData,
    appleProductId: expectedAppleId,
    transactionId,
  })

  const normalizedAddress = validateBillingAddress({
    name: billingAddress.name,
    email: billingAddress.email,
    phone: billingAddress.phone || 'N/A',
    purchaseReasons: billingAddress.purchaseReasons?.length
      ? billingAddress.purchaseReasons
      : ['personal'],
    purchaseReasonOther: billingAddress.purchaseReasonOther || '',
  })

  const categories = await Category.find().lean()
  const categoryMap = buildCategoryMap(categories)
  const formatted = formatProduct(product, categoryMap)
  const pricing = resolveTierPrice(product, imageSize)

  let clipId = product.clipId
  if (!clipId) {
    clipId = await generateClipId()
    await Product.findByIdAndUpdate(product._id, { clipId })
  }

  const orderItems = applyPayableLineTotals(
    [
      {
        productId: formatted.id,
        clipId,
        licenseNumber: generateLicenseNumber(),
        name: formatted.name,
        brand: formatted.brand || '',
        imageSize: pricing.imageSize,
        image: formatted.images?.[0] || formatted.videoPoster || '',
        quantity: 1,
        basePrice: pricing.basePrice,
        gstPercentage: pricing.gstPercentage,
        gstAmount: pricing.gstAmount,
        price: pricing.price,
        lineTotal: pricing.price,
      },
    ],
    {
      subtotal: pricing.basePrice,
      gstTotal: pricing.gstAmount,
      discountAmount: 0,
      total: pricing.price,
    },
  )

  const order = await Order.create({
    sessionId,
    userId,
    orderNumber: buildOrderNumber(),
    items: orderItems,
    billingAddress: normalizedAddress,
    paymentMethod: 'online',
    paymentProvider: 'apple',
    subtotalAmount: pricing.basePrice,
    gstAmount: pricing.gstAmount,
    promoCode: '',
    discountAmount: 0,
    totalAmount: pricing.price,
    paymentStatus: 'pending',
    status: 'pending',
    appleProductId: expectedAppleId,
    appleTransactionId: verification.transactionId,
    appleOriginalTransactionId:
      verification.originalTransactionId || verification.transactionId,
    appleReceiptData: receiptData ? receiptData.slice(0, 200000) : '',
  })

  return confirmOnlineOrderPayment(
    order,
    {
      appleTransactionId: verification.transactionId,
      appleOriginalTransactionId:
        verification.originalTransactionId || verification.transactionId,
      appleProductId: expectedAppleId,
    },
    { clearCart: false },
  )
}
