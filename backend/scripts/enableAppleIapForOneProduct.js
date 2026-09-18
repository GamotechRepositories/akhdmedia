/**
 * Enable Apple IAP on one product for StoreKit testing.
 *
 * Usage:
 *   node scripts/enableAppleIapForOneProduct.js
 *   node scripts/enableAppleIapForOneProduct.js <mongoProductId>
 *   node scripts/enableAppleIapForOneProduct.js --clip AKHD-12345
 */
import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import Product from '../models/Product.js'
import { PURCHASE_TYPES, buildAppleProductId } from '../constants/purchaseTypes.js'

const args = process.argv.slice(2)
const clipFlagIndex = args.indexOf('--clip')
const clipId = clipFlagIndex >= 0 ? args[clipFlagIndex + 1] : ''
const productId = clipFlagIndex >= 0 ? '' : args[0] || ''

await mongoose.connect(process.env.MONGO_URI)

let product = null
if (productId && mongoose.Types.ObjectId.isValid(productId)) {
  product = await Product.findById(productId)
} else if (clipId) {
  product = await Product.findOne({ clipId: clipId.trim().toUpperCase() })
} else {
  product = await Product.findOne({ isActive: true, mediaType: 'video' }).sort({
    createdAt: -1,
  })
}

if (!product) {
  console.error('No product found')
  process.exit(1)
}

const appleProductId = buildAppleProductId(product._id, product.mediaType)
product.purchaseType = PURCHASE_TYPES.APPLE_IAP
product.appleProductId = appleProductId
await product.save()

console.log(
  JSON.stringify(
    {
      id: product._id.toString(),
      name: product.name,
      clipId: product.clipId,
      purchaseType: product.purchaseType,
      appleProductId: product.appleProductId,
      note: 'Create this Non-Consumable (or Consumable) product in App Store Connect with the same Product ID.',
    },
    null,
    2,
  ),
)

await mongoose.disconnect()
