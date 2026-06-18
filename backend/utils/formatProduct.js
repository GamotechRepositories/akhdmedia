import { PRICING_MODES } from '../constants/pricingModes.js'
import { getAvailableTiers, sortTierList } from '../constants/resolutionTiers.js'
import {
  getListingPrice,
  resolveImageSizes,
  serializeResolutionPricing,
} from './resolveImageSizes.js'
import { hasDeliverableMasterFile } from './productDelivery.js'

export const serializeDeliveryFiles = (deliveryFiles, availableTiers = []) => {
  const source =
    deliveryFiles instanceof Map
      ? Object.fromEntries(deliveryFiles.entries())
      : deliveryFiles || {}

  const tiers = availableTiers.length
    ? sortTierList(availableTiers)
    : sortTierList(Object.keys(source))

  return Object.fromEntries(
    tiers.map((tier) => {
      const tierData = source[tier] || {}
      return [
        tier,
        {
          videoKey: tierData.videoKey || '',
          videoFilename: tierData.videoFilename || '',
          imageKeys: tierData.imageKeys || [],
          imageFilenames: tierData.imageFilenames || [],
        },
      ]
    }),
  )
}

const formatProduct = (product, categoryMap = {}, options = {}) => {
  const category = categoryMap[product.categorySlug]
  const pricingMode = product.pricingMode || PRICING_MODES.UNIFORM
  const imageSizes = resolveImageSizes(product)

  const enabledTiers = getAvailableTiers(product)
  const allPricing = serializeResolutionPricing(product.resolutionPricing)

  const formatted = {
    id: product._id.toString(),
    mediaType: product.mediaType || 'video',
    pricingMode,
    resolutionPricing: Object.fromEntries(
      Object.entries(allPricing).filter(([tier]) => enabledTiers.includes(tier)),
    ),
    imageSizes,
    clipId: product.clipId || '',
    name: product.name,
    category: category?.breadcrumb || product.categorySlug,
    categorySlug: product.categorySlug,
    subCategory: product.subCategorySlug,
    brand: product.brand,
    price: getListingPrice(product),
    gstPercentage: Number(product.gstPercentage) || 0,
    availableTiers: enabledTiers,
    rating: product.rating,
    description: product.description,
    images: product.images,
    demoVideo: product.demoVideo,
    videoPoster: product.videoPoster,
    videoInfo: product.videoInfo,
    isActive: product.isActive,
    showInLatest: Boolean(product.showInLatest),
    isPurchasable: hasDeliverableMasterFile(product),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }

  if (options.includeDelivery) {
    formatted.deliveryFiles = serializeDeliveryFiles(
      product.deliveryFiles,
      enabledTiers,
    )
    formatted.masterVideoKey = product.masterVideoKey || ''
    formatted.masterVideoFilename = product.masterVideoFilename || ''
    formatted.masterVideoTier = product.masterVideoTier || ''
  }

  return formatted
}

export const buildCategoryMap = (categories) =>
  Object.fromEntries(categories.map((category) => [category.slug, category]))

export default formatProduct
