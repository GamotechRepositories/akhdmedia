export const RESOLUTION_TIERS = {
  SD: { resolution: '854×480', size: '2 MB' },
  HD: { resolution: '1280×720', size: '4 MB' },
  'Full HD': { resolution: '1920×1080', size: '6 MB' },
  '2K': { resolution: '2048×1080', size: '12 MB' },
  '4K': { resolution: '3840×2160', size: '48 MB' },
  '6K': { resolution: '6144×3456', size: '72 MB' },
  '8K': { resolution: '7680×4320', size: '96 MB' },
}

export const RESOLUTION_ORDER = Object.keys(RESOLUTION_TIERS)

export const isStandardTier = (tier) => RESOLUTION_ORDER.includes(tier)

export const sortTierList = (tiers = []) => {
  const unique = [...new Set(tiers.map((tier) => tier?.trim()).filter(Boolean))]
  const standard = RESOLUTION_ORDER.filter((tier) => unique.includes(tier))
  const custom = unique.filter((tier) => !isStandardTier(tier))
  return [...standard, ...custom]
}

export const getTierRank = (tier) => {
  const index = RESOLUTION_ORDER.indexOf(tier)
  return index === -1 ? RESOLUTION_ORDER.length : index
}

/** Lowest tier offered to customers (SD/HD are excluded) */
export const MIN_CUSTOMER_TIER = 'Full HD'

export const CUSTOMER_TIER_ORDER = RESOLUTION_ORDER.filter(
  (tier) => getTierRank(tier) >= getTierRank(MIN_CUSTOMER_TIER),
)

export const getCustomerTiers = (tiers = []) =>
  sortTierList(tiers).filter((tier) => getTierRank(tier) >= getTierRank(MIN_CUSTOMER_TIER))

export const getAvailableTiers = (productOrBody = {}) => {
  const selected = sortTierList(productOrBody.availableTiers || [])
  const base = selected.length ? selected : [...RESOLUTION_ORDER]
  return getCustomerTiers(base)
}

export const parseResolutionString = (value = '') => {
  const match = String(value).match(/(\d+)\s*[×x]\s*(\d+)/i)
  if (!match) return null
  return { width: Number(match[1]), height: Number(match[2]) }
}

export const getTierDimensions = (tier, resolutionPricing = {}) => {
  const pricingSource =
    resolutionPricing instanceof Map
      ? Object.fromEntries(resolutionPricing.entries())
      : resolutionPricing

  const customResolution = pricingSource?.[tier]?.resolution
  const parsed =
    parseResolutionString(customResolution) ||
    parseResolutionString(RESOLUTION_TIERS[tier]?.resolution)

  return parsed
}

export const getTierPixelCount = (tier, resolutionPricing = {}) => {
  const dims = getTierDimensions(tier, resolutionPricing)
  return dims ? dims.width * dims.height : 0
}

export const getTiersUpToMaster = (masterTier, tiers = []) => {
  if (!masterTier) return sortTierList(tiers)
  const masterRank = getTierRank(masterTier)
  return sortTierList(tiers).filter((tier) => getTierRank(tier) <= masterRank)
}

export const getTiersAboveMaster = (masterTier, tiers = []) => {
  if (!masterTier) return []
  const masterRank = getTierRank(masterTier)
  return sortTierList(tiers).filter((tier) => getTierRank(tier) > masterRank)
}

export const getDeliverableCustomerTiers = (masterTier, tiers = CUSTOMER_TIER_ORDER) =>
  getCustomerTiers(getTiersUpToMaster(masterTier, tiers))

/** @deprecated use MIN_CUSTOMER_TIER */
export const MIN_TRANSCODE_TIER = MIN_CUSTOMER_TIER

/** @deprecated use getCustomerTiers */
export const getTiersForTranscode = getCustomerTiers

/** @deprecated no longer used — SD/HD are not sold */
export const getTiersBelowMinTranscode = () => []
