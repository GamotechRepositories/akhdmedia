/**
 * Enable Apple IAP on every product (or only active ones).
 *
 * Usage:
 *   node scripts/enableAppleIapForAllProducts.js
 *   node scripts/enableAppleIapForAllProducts.js --all
 *   node scripts/enableAppleIapForAllProducts.js --dry-run
 */
import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import Product from '../models/Product.js'
import { PURCHASE_TYPES, buildAppleProductId } from '../constants/purchaseTypes.js'

const args = process.argv.slice(2)
const includeInactive = args.includes('--all')
const dryRun = args.includes('--dry-run')

await mongoose.connect(process.env.MONGO_URI)

const filter = includeInactive ? {} : { isActive: true }
const products = await Product.find(filter).select('_id mediaType purchaseType appleProductId clipId')

let updated = 0
const ops = []

for (const product of products) {
  const appleProductId = buildAppleProductId(product._id, product.mediaType)
  const needsUpdate =
    product.purchaseType !== PURCHASE_TYPES.APPLE_IAP ||
    product.appleProductId !== appleProductId

  if (!needsUpdate) continue

  updated += 1
  if (!dryRun) {
    ops.push({
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            purchaseType: PURCHASE_TYPES.APPLE_IAP,
            appleProductId,
          },
        },
      },
    })
  }
}

if (!dryRun && ops.length) {
  const batchSize = 200
  for (let i = 0; i < ops.length; i += batchSize) {
    await Product.bulkWrite(ops.slice(i, i + batchSize))
  }
}

console.log(
  JSON.stringify(
    {
      scanned: products.length,
      updated,
      dryRun,
      includeInactive,
      note: dryRun
        ? 'Re-run without --dry-run to apply.'
        : 'Regenerate StoreKit config: node scripts/generateStoreKitConfiguration.js',
    },
    null,
    2,
  ),
)

await mongoose.disconnect()
