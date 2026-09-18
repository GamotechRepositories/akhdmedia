import {
  getAscAppId,
  getAscInrToUsdRate,
  isAscConfigured,
  isAscSyncEnabled,
} from '../config/appStoreConnect.js'
import { buildAppleProductId } from '../constants/purchaseTypes.js'
import { getListingPrice } from '../utils/resolveImageSizes.js'
import { AscApiError, ascRequest } from './appStoreConnectClient.js'

const sanitizeName = (value = '', max = 30) => {
  const cleaned = String(value || '')
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return 'AKHD Clip'
  return cleaned.slice(0, max)
}

const sanitizeDescription = (value = '', max = 45) => {
  const cleaned = String(value || '')
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!cleaned) return 'Editorial media license from AKHD Media'
  return cleaned.slice(0, max)
}

const inrToUsd = (inr) => {
  const usd = Number(inr) / getAscInrToUsdRate()
  if (!Number.isFinite(usd) || usd <= 0) return 0.99
  return Math.min(999.99, Math.max(0.99, usd))
}

const findClosestPricePoint = (pricePoints = [], targetUsd) => {
  if (!pricePoints.length) return null
  let best = null
  let bestDelta = Number.POSITIVE_INFINITY
  for (const point of pricePoints) {
    const customerPrice = Number(point?.attributes?.customerPrice)
    if (!Number.isFinite(customerPrice)) continue
    const delta = Math.abs(customerPrice - targetUsd)
    if (delta < bestDelta) {
      best = point
      bestDelta = delta
    }
  }
  return best
}

const listPricePointsUsa = async (iapId) => {
  const collected = []
  let next = `/v2/inAppPurchases/${iapId}/pricePoints?filter[territory]=USA&limit=200`

  while (next) {
    const page = await ascRequest('GET', next)
    collected.push(...(page?.data || []))
    next = page?.links?.next || null
  }

  return collected
}

const createInAppPurchase = async ({ name, productId, reviewNote }) => {
  const response = await ascRequest('POST', '/v2/inAppPurchases', {
    body: {
      data: {
        type: 'inAppPurchases',
        attributes: {
          name: sanitizeName(name, 64),
          productId,
          inAppPurchaseType: 'NON_CONSUMABLE',
          familySharable: false,
          reviewNote: sanitizeDescription(reviewNote, 200),
        },
        relationships: {
          app: {
            data: {
              type: 'apps',
              id: getAscAppId(),
            },
          },
        },
      },
    },
  })
  return response?.data
}

const createVersionAndLocalization = async (iapId, { localeName, localeDescription }) => {
  const versionResponse = await ascRequest('POST', '/v1/inAppPurchaseVersions', {
    body: {
      data: {
        type: 'inAppPurchaseVersions',
        relationships: {
          inAppPurchase: {
            data: {
              type: 'inAppPurchases',
              id: iapId,
            },
          },
        },
      },
    },
  })

  const versionId = versionResponse?.data?.id
  if (!versionId) {
    throw new AscApiError('ASC did not return an in-app purchase version id')
  }

  await ascRequest('POST', '/v2/inAppPurchaseLocalizations', {
    body: {
      data: {
        type: 'inAppPurchaseLocalizations',
        attributes: {
          locale: 'en-US',
          name: sanitizeName(localeName, 30),
          description: sanitizeDescription(localeDescription, 45),
        },
        relationships: {
          version: {
            data: {
              type: 'inAppPurchaseVersions',
              id: versionId,
            },
          },
        },
      },
    },
  })

  return versionId
}

const setPriceSchedule = async (iapId, pricePointId) => {
  const tempPriceId = `price-${iapId}`
  await ascRequest('POST', '/v1/inAppPurchasePriceSchedules', {
    body: {
      data: {
        type: 'inAppPurchasePriceSchedules',
        relationships: {
          inAppPurchase: {
            data: {
              type: 'inAppPurchases',
              id: iapId,
            },
          },
          baseTerritory: {
            data: {
              type: 'territories',
              id: 'USA',
            },
          },
          manualPrices: {
            data: [
              {
                type: 'inAppPurchasePrices',
                id: tempPriceId,
              },
            ],
          },
        },
      },
      included: [
        {
          type: 'inAppPurchasePrices',
          id: tempPriceId,
          attributes: {
            startDate: null,
            endDate: null,
          },
          relationships: {
            inAppPurchaseV2: {
              data: {
                type: 'inAppPurchases',
                id: iapId,
              },
            },
            inAppPurchasePricePoint: {
              data: {
                type: 'inAppPurchasePricePoints',
                id: pricePointId,
              },
            },
          },
        },
      ],
    },
  })
}

const findExistingIapByProductId = async (productId) => {
  const appId = getAscAppId()
  let next = `/v1/apps/${appId}/inAppPurchasesV2?limit=200&filter[productId]=${encodeURIComponent(productId)}`

  while (next) {
    const page = await ascRequest('GET', next)
    const match = (page?.data || []).find(
      (entry) => entry?.attributes?.productId === productId,
    )
    if (match) return match
    next = page?.links?.next || null
  }

  return null
}

/**
 * Create (or reuse) an App Store Connect Non-Consumable for a catalog product.
 * Does not submit for App Review (still needs screenshot + review submission).
 */
export const syncProductToAppStoreConnect = async (product) => {
  if (!isAscSyncEnabled()) {
    return {
      skipped: true,
      reason: isAscConfigured()
        ? 'APPLE_ASC_SYNC_ENABLED=false'
        : 'App Store Connect API credentials are not configured',
    }
  }

  const productId =
    product.appleProductId || buildAppleProductId(product._id, product.mediaType)
  const clipLabel = product.clipId || String(product._id)
  const displayName = sanitizeName(`${clipLabel}`, 30)
  const description = sanitizeDescription(product.name || product.description, 45)
  const reviewNote = `Editorial license for ${clipLabel}`

  let iap = await findExistingIapByProductId(productId)
  let created = false

  if (!iap) {
    iap = await createInAppPurchase({
      name: sanitizeName(`${clipLabel} ${product.name || ''}`.trim(), 64),
      productId,
      reviewNote,
    })
    created = true
  }

  const iapId = iap?.id
  if (!iapId) {
    throw new AscApiError('ASC did not return an in-app purchase id')
  }

  // Localization / version (ignore if metadata already present)
  try {
    await createVersionAndLocalization(iapId, {
      localeName: displayName,
      localeDescription: description,
    })
  } catch (error) {
    if (!(error instanceof AscApiError) || ![409, 422].includes(error.status)) {
      throw error
    }
  }

  const listingInr = getListingPrice(product)
  const targetUsd = inrToUsd(listingInr)
  const pricePoints = await listPricePointsUsa(iapId)
  const closest = findClosestPricePoint(pricePoints, targetUsd)
  if (!closest?.id) {
    throw new AscApiError('No USA price points returned from App Store Connect')
  }

  try {
    await setPriceSchedule(iapId, closest.id)
  } catch (error) {
    if (!(error instanceof AscApiError) || ![409, 422].includes(error.status)) {
      throw error
    }
  }

  return {
    skipped: false,
    created,
    appleProductId: productId,
    appleAscIapId: iapId,
    appleAscState: iap?.attributes?.state || '',
    customerPriceUsd: Number(closest.attributes?.customerPrice),
    listingPriceInr: listingInr,
  }
}

export const applyAscSyncResultToProduct = async (product, result) => {
  if (!product) return product

  if (result?.skipped) {
    product.appleAscSyncStatus = 'skipped'
    product.appleAscSyncError = result.reason || ''
    product.appleAscSyncedAt = new Date()
    await product.save()
    return product
  }

  product.appleProductId = result.appleProductId || product.appleProductId
  product.appleAscIapId = result.appleAscIapId || product.appleAscIapId
  product.appleAscSyncStatus = 'synced'
  product.appleAscSyncError = ''
  product.appleAscSyncedAt = new Date()
  await product.save()
  return product
}

export const markAscSyncError = async (product, error) => {
  if (!product) return product
  product.appleAscSyncStatus = 'error'
  product.appleAscSyncError = String(error?.message || error || 'ASC sync failed').slice(0, 500)
  product.appleAscSyncedAt = new Date()
  await product.save()
  return product
}
