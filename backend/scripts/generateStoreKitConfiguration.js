/**
 * Rebuild IOSApp/app/ios/Configuration.storekit from MongoDB products.
 * Local StoreKit testing only — does NOT create App Store Connect products.
 *
 * Usage:
 *   node scripts/generateStoreKitConfiguration.js
 *   node scripts/generateStoreKitConfiguration.js --all
 */
import dotenv from 'dotenv'
dotenv.config()

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import Product from '../models/Product.js'
import { buildAppleProductId } from '../constants/purchaseTypes.js'
import { getListingPrice } from '../utils/resolveImageSizes.js'

const args = process.argv.slice(2)
const includeInactive = args.includes('--all')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(
  __dirname,
  '../../IOSApp/app/ios/Configuration.storekit',
)

/** Rough INR → USD for local StoreKit display (US storefront). */
const inrToUsdDisplay = (inr) => {
  const usd = Number(inr) / 83
  if (!Number.isFinite(usd) || usd <= 0) return '0.99'
  return Math.min(999.99, Math.max(0.99, Math.round(usd * 100) / 100)).toFixed(2)
}

const sanitize = (value = '', max = 80) =>
  String(value || '')
    .replace(/[\u0000-\u001f]/g, ' ')
    .trim()
    .slice(0, max) || 'AKHD Clip'

await mongoose.connect(process.env.MONGO_URI)

const filter = includeInactive ? {} : { isActive: true }
const products = await Product.find(filter)
  .select('_id name clipId mediaType price resolutionPricing pricingMode availableTiers')
  .sort({ createdAt: -1 })
  .lean()

const storekitProducts = products.map((product) => {
  const id = product._id.toString()
  const appleProductId =
    buildAppleProductId(id, product.mediaType)
  const clipId = product.clipId || id.slice(-6)
  const listingPrice = getListingPrice(product)

  return {
    displayPrice: inrToUsdDisplay(listingPrice),
    familyShareable: false,
    internalID: id.toUpperCase(),
    localizations: [
      {
        description: sanitize(product.name, 120),
        displayName: sanitize(`AKHD ${clipId}`, 35),
        locale: 'en_US',
      },
    ],
    productID: appleProductId,
    referenceName: sanitize(`${clipId} ${product.name}`, 64),
    type: 'NonConsumable',
  }
})

const config = {
  identifier: 'akhdmedia_storekit',
  nonRenewingSubscriptions: [],
  products: storekitProducts,
  settings: {
    _applicationInternalID: '0',
    _developerTeamID: '',
    _failTransactionsEnabled: false,
    _lastStorefrontUpdateTime: 0,
    _locale: 'en_US',
    _storefront: 'USA',
    _storeKitErrors: [],
  },
  subscriptionGroups: [],
  version: {
    major: 3,
    minor: 0,
  },
}

fs.writeFileSync(outputPath, `${JSON.stringify(config, null, 2)}\n`)

console.log(
  JSON.stringify(
    {
      written: outputPath,
      productCount: storekitProducts.length,
      includeInactive,
      note: 'Local simulator only. New products: re-run this script. App Store Connect still requires manual (or ASC API) product creation.',
    },
    null,
    2,
  ),
)

await mongoose.disconnect()
