import { PRICING_MODES } from '../constants/pricingModes.js'
import {
  RESOLUTION_ORDER,
  RESOLUTION_TIERS,
  getAvailableTiers,
} from '../constants/resolutionTiers.js'

const readMapValue = (resolutionPricing, key) => {
  if (!resolutionPricing) return null

  if (resolutionPricing instanceof Map) {
    return resolutionPricing.get(key) || null
  }

  return resolutionPricing[key] || null
}

const readTierField = (resolutionPricing, key, field, fallback) => {
  const tier = readMapValue(resolutionPricing, key)
  const value = tier?.[field]
  if (value === undefined || value === null || value === '') return fallback
  return field === 'price' ? Number(value) : value
}

const buildTierEntry = (key, resolutionPricing, price) => ({
  resolution: readTierField(
    resolutionPricing,
    key,
    'resolution',
    RESOLUTION_TIERS[key].resolution
  ),
  size: readTierField(resolutionPricing, key, 'size', RESOLUTION_TIERS[key].size),
  price,
})

export const buildUniformImageSizes = (uniformPrice, resolutionPricing = null) =>
  Object.fromEntries(
    RESOLUTION_ORDER.map((key) => [
      key,
      buildTierEntry(key, resolutionPricing, uniformPrice),
    ])
  )

export const buildCustomImageSizes = (resolutionPricing, fallbackPrice = 0) =>
  Object.fromEntries(
    RESOLUTION_ORDER.map((key) => [
      key,
      buildTierEntry(
        key,
        resolutionPricing,
        readTierField(resolutionPricing, key, 'price', fallbackPrice)
      ),
    ])
  )

export const serializeResolutionPricing = (resolutionPricing = {}) => {
  const entries =
    resolutionPricing instanceof Map
      ? [...resolutionPricing.entries()]
      : Object.entries(resolutionPricing)

  return Object.fromEntries(
    entries.map(([key, value]) => [
      key,
      {
        price: Number(value.price),
        resolution: value.resolution || RESOLUTION_TIERS[key]?.resolution || '',
        size: value.size || RESOLUTION_TIERS[key]?.size || '',
      },
    ])
  )
}

export const resolveImageSizes = (product) => {
  const pricingMode = product.pricingMode || PRICING_MODES.UNIFORM
  const basePrice = Number(product.price) || 0
  const resolutionPricing = product.resolutionPricing
  const enabledTiers = getAvailableTiers(product)

  const allSizes =
    pricingMode === PRICING_MODES.CUSTOM
      ? buildCustomImageSizes(resolutionPricing, basePrice)
      : buildUniformImageSizes(basePrice, resolutionPricing)

  return Object.fromEntries(
    Object.entries(allSizes).filter(([tier]) => enabledTiers.includes(tier)),
  )
}

export const getListingPrice = (product) => {
  const imageSizes = resolveImageSizes(product)
  const enabledTiers = getAvailableTiers(product)
  const preferredTier = enabledTiers.includes('4K')
    ? '4K'
    : enabledTiers[enabledTiers.length - 1]
  return Number(imageSizes[preferredTier]?.price ?? product.price ?? 0)
}
