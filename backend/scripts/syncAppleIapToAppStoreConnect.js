/**
 * Sync catalog products into App Store Connect as Non-Consumable IAPs.
 *
 * Requires APPLE_ASC_* env vars (see backend/.env comments).
 *
 * Usage:
 *   node scripts/syncAppleIapToAppStoreConnect.js --dry-run
 *   node scripts/syncAppleIapToAppStoreConnect.js --limit 5
 *   node scripts/syncAppleIapToAppStoreConnect.js --clip AKHD-77528
 *   node scripts/syncAppleIapToAppStoreConnect.js --pending
 *   node scripts/syncAppleIapToAppStoreConnect.js
 */
import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
import Product from '../models/Product.js'
import { isAscConfigured, isAscSyncEnabled } from '../config/appStoreConnect.js'
import {
  applyAscSyncResultToProduct,
  markAscSyncError,
  syncProductToAppStoreConnect,
} from '../services/appStoreConnectIapService.js'
import { PURCHASE_TYPES, buildAppleProductId } from '../constants/purchaseTypes.js'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const pendingOnly = args.includes('--pending')
const clipFlag = args.indexOf('--clip')
const clipId = clipFlag >= 0 ? args[clipFlag + 1] : ''
const limitFlag = args.indexOf('--limit')
const limit = limitFlag >= 0 ? Number(args[limitFlag + 1]) : 0

if (!isAscConfigured()) {
  console.error(
    'Missing App Store Connect credentials. Set APPLE_ASC_ISSUER_ID, APPLE_ASC_KEY_ID, APPLE_ASC_APP_ID, and APPLE_ASC_PRIVATE_KEY or APPLE_ASC_PRIVATE_KEY_PATH.',
  )
  process.exit(1)
}

if (!isAscSyncEnabled()) {
  console.error('APPLE_ASC_SYNC_ENABLED=false — enable it to sync.')
  process.exit(1)
}

await mongoose.connect(process.env.MONGO_URI)

const filter = { isActive: true }
if (clipId) {
  filter.clipId = clipId.trim().toUpperCase()
} else if (pendingOnly) {
  filter.appleAscSyncStatus = { $in: ['pending', 'error', 'skipped', null] }
}

let query = Product.find(filter).sort({ createdAt: -1 })
if (Number.isFinite(limit) && limit > 0) {
  query = query.limit(limit)
}

const products = await query
const summary = { scanned: products.length, synced: 0, skipped: 0, errors: 0 }

for (const product of products) {
  product.purchaseType = PURCHASE_TYPES.APPLE_IAP
  product.appleProductId =
    product.appleProductId || buildAppleProductId(product._id, product.mediaType)

  if (dryRun) {
    console.log(`[dry-run] ${product.clipId} → ${product.appleProductId}`)
    summary.skipped += 1
    continue
  }

  try {
    const result = await syncProductToAppStoreConnect(product)
    await applyAscSyncResultToProduct(product, result)
    if (result.skipped) {
      summary.skipped += 1
      console.log(`[skipped] ${product.clipId}: ${result.reason}`)
    } else {
      summary.synced += 1
      console.log(
        `[synced] ${product.clipId} → ${result.appleProductId} (asc=${result.appleAscIapId}, $${result.customerPriceUsd})`,
      )
    }
  } catch (error) {
    summary.errors += 1
    await markAscSyncError(product, error)
    console.error(`[error] ${product.clipId}:`, error.message || error)
  }

  // Stay under ASC rate limits
  await new Promise((resolve) => setTimeout(resolve, 350))
}

console.log(JSON.stringify(summary, null, 2))
await mongoose.disconnect()
