import { PRICING_MODES } from '../constants/pricingModes.js'
import { getAvailableTiers, sortTierList } from '../constants/resolutionTiers.js'
import {
  getListingPrice,
  resolveImageSizes,
  serializeResolutionPricing,
} from './resolveImageSizes.js'
import { hasDeliverableMasterFile } from './productDelivery.js'
import { normalizeYoutubeEmbedUrl } from './youtubeShort.js'

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
    demoVideoSource: product.demoVideoSource || 's3',
    demoVideo: product.demoVideo,
    demoVideoYoutubeUrl:
      product.demoVideoSource === 'youtube'
        ? normalizeYoutubeEmbedUrl(product.demoVideoYoutubeUrl || '')
        : product.demoVideoYoutubeUrl || '',
    videoPoster: product.videoPoster,
    videoInfo: product.videoInfo,
    isActive: product.isActive,
    showInLatest: Boolean(product.showInLatest),
    actorListingOrder: product.actorListingOrder ?? product.allListingOrder ?? 0,
    categoryListingOrder: product.categoryListingOrder ?? 0,
    actorIds: (product.actorIds?.length
      ? product.actorIds
      : product.actorId
        ? [product.actorId]
        : []
    ).map((id) => id.toString()),
    actorNames: product.actorNames?.length
      ? product.actorNames
      : product.actorName
        ? product.actorName
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean)
        : [],
    actorId: product.actorId?.toString() || '',
    actorName: product.actorName || '',
    actorSearchKeywords: product.actorSearchKeywords || [],
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
