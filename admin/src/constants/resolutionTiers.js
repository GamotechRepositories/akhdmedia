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

/** Lowest tier offered to customers (SD/HD are excluded) */
export const MIN_CUSTOMER_TIER = 'Full HD'

export const CUSTOMER_TIER_ORDER = RESOLUTION_ORDER.filter(
  (tier) => getTierRank(tier) >= getTierRank(MIN_CUSTOMER_TIER),
)

export const getCustomerTiers = (tiers = []) =>
  sortTierList(tiers).filter((tier) => getTierRank(tier) >= getTierRank(MIN_CUSTOMER_TIER))

export const getDeliverableCustomerTiers = (masterTier, tiers = CUSTOMER_TIER_ORDER) =>
  getCustomerTiers(getTiersUpToMaster(masterTier, tiers))

export const buildDefaultTierConfig = (basePrice = 499) =>
  Object.fromEntries(
    RESOLUTION_ORDER.map((tier, index) => {
      const defaults = RESOLUTION_TIERS[tier]
      const factor = 0.15 + index * 0.12
      return [
        tier,
        {
          resolution: defaults.resolution,
          size: defaults.size,
          price: Math.max(49, Math.round(basePrice * factor)),
        },
      ]
    })
  )

/** @deprecated */
export const buildDefaultCustomPricing = buildDefaultTierConfig
