import { MEDIA_TYPES } from '../constants/mediaTypes.js'
import { PRICING_MODES } from '../constants/pricingModes.js'
import {
  RESOLUTION_ORDER,
  RESOLUTION_TIERS,
  getAvailableTiers,
  getTiersAboveMaster,
  getTierRank,
  isStandardTier,
  MIN_CUSTOMER_TIER,
} from '../constants/resolutionTiers.js'

const cleanImages = (images = []) =>
  images.map((url) => url?.trim()).filter(Boolean)

const cleanKeys = (keys = []) =>
  keys.map((key) => key?.trim()).filter(Boolean)

const buildDeliveryFilesMap = (body = {}) => {
  const deliveryFiles = new Map()
  const source = body.deliveryFiles || {}
  const enabledTiers = getAvailableTiers(body)

  enabledTiers.forEach((tier) => {
    const tierData = source[tier] || {}
    deliveryFiles.set(tier, {
      videoKey: tierData.videoKey?.trim() || '',
      videoFilename: tierData.videoFilename?.trim() || '',
      imageKeys: cleanKeys(tierData.imageKeys || []),
      imageFilenames: cleanKeys(tierData.imageFilenames || []),
    })
  })

  return deliveryFiles
}

const buildMasterVideoDeliveryFiles = (masterVideoKey, masterVideoFilename, tiers = []) => {
  const deliveryFiles = new Map()
  const key = masterVideoKey?.trim() || ''
  const filename = masterVideoFilename?.trim() || ''

  tiers.forEach((tier) => {
    deliveryFiles.set(tier, {
      videoKey: key,
      videoFilename: filename,
      imageKeys: [],
      imageFilenames: [],
    })
  })

  return deliveryFiles
}

const readTierInput = (body, tier) => {
  const tierData = body.resolutionPricing?.[tier] || {}
  const defaults = RESOLUTION_TIERS[tier] || {}
  return {
    resolution: tierData.resolution?.trim() || defaults.resolution || '',
    size: tierData.size?.trim() || defaults.size || '',
    price: Number(tierData.price),
  }
}

const buildResolutionPricingMap = (body, pricingMode, uniformPrice) => {
  const resolutionPricing = new Map()
  const enabledTiers = getAvailableTiers(body)

  enabledTiers.forEach((tier) => {
    const tierInput = readTierInput(body, tier)
    resolutionPricing.set(tier, {
      resolution: tierInput.resolution,
      size: tierInput.size,
      price: pricingMode === PRICING_MODES.UNIFORM ? uniformPrice : tierInput.price,
    })
  })

  return resolutionPricing
}

export const normalizeProductPayload = (body = {}) => {
  const mediaType = body.mediaType === MEDIA_TYPES.IMAGE
    ? MEDIA_TYPES.IMAGE
    : MEDIA_TYPES.VIDEO

  const images = cleanImages(body.images)
  const pricingMode =
    body.pricingMode === PRICING_MODES.CUSTOM
      ? PRICING_MODES.CUSTOM
      : PRICING_MODES.UNIFORM

  const payload = {
    clipId: body.clipId?.trim().toUpperCase() || '',
    name: body.name?.trim(),
    mediaType,
    pricingMode,
    categorySlug: body.categorySlug?.trim().toLowerCase(),
    subCategorySlug: body.subCategorySlug?.trim() || '',
    brand: body.brand?.trim() || '',
    price: 0,
    resolutionPricing: new Map(),
    rating: Number(body.rating) || 0,
    description: body.description?.trim() || '',
    images,
    availableTiers: getAvailableTiers(body),
    deliveryFiles: buildDeliveryFilesMap(body),
    isActive: body.isActive !== false,
  }

  if (pricingMode === PRICING_MODES.CUSTOM) {
    payload.resolutionPricing = buildResolutionPricingMap(body, pricingMode, 0)
    payload.price = Number(
      body.resolutionPricing?.['4K']?.price ??
        payload.resolutionPricing.get('4K')?.price ??
        body.price
    )
  } else {
    payload.price = Number(body.price)
    payload.resolutionPricing = buildResolutionPricingMap(
      body,
      pricingMode,
      payload.price
    )
  }

  if (mediaType === MEDIA_TYPES.VIDEO) {
    payload.demoVideo = body.demoVideo?.trim() || ''
    payload.videoPoster = body.videoPoster?.trim() || images[0] || ''
    payload.masterVideoKey = body.masterVideoKey?.trim() || ''
    payload.masterVideoFilename = body.masterVideoFilename?.trim() || ''
    payload.masterVideoTier = body.masterVideoTier?.trim() || ''
    payload.videoInfo = {
      quality: body.videoInfo?.quality?.trim() || '',
      fps: body.videoInfo?.fps?.trim() || '',
      size: body.videoInfo?.size?.trim() || '',
      duration: body.videoInfo?.duration?.trim() || '',
      format: body.videoInfo?.format?.trim() || '',
      orientationNote: body.videoInfo?.orientationNote?.trim() || '',
    }

    if (payload.masterVideoKey) {
      payload.deliveryFiles = buildMasterVideoDeliveryFiles(
        payload.masterVideoKey,
        payload.masterVideoFilename,
        getAvailableTiers(payload),
      )
    }
  } else {
    payload.masterVideoKey = body.masterVideoKey?.trim() || ''
    payload.masterVideoFilename = body.masterVideoFilename?.trim() || ''
    payload.masterVideoTier = body.masterVideoTier?.trim() || ''
    payload.demoVideo = ''
    payload.videoPoster = images[0] || ''
    payload.videoInfo = {
      quality: body.videoInfo?.quality?.trim() || '',
      fps: '',
      size: body.videoInfo?.size?.trim() || '',
      duration: '',
      format: body.videoInfo?.format?.trim() || 'JPEG / PNG',
      orientationNote: body.videoInfo?.orientationNote?.trim() || '',
    }
  }

  return payload
}

export const validateProductPayload = (payload) => {
  const errors = []

  if (!payload.name) errors.push('Product name is required')
  if (!payload.categorySlug) errors.push('Category is required')

  const enabledTiers = getAvailableTiers(payload)

  if (!enabledTiers.length) {
    errors.push(
      `Select at least one customer quality (${MIN_CUSTOMER_TIER} and above). SD is not sold.`,
    )
  }

  enabledTiers.forEach((tier) => {
    const tierData = payload.resolutionPricing.get(tier)
    if (!tierData?.resolution?.trim()) {
      errors.push(`Dimensions are required for ${tier}`)
    }
    if (!tierData?.size?.trim()) {
      errors.push(`File size is required for ${tier}`)
    }
    if (!isStandardTier(tier) && !tierData?.resolution?.trim()) {
      errors.push(`Dimensions are required for custom tier ${tier}`)
    }
  })

  if (payload.pricingMode === PRICING_MODES.CUSTOM) {
    enabledTiers.forEach((tier) => {
      const tierPrice = payload.resolutionPricing.get(tier)?.price
      if (!Number.isFinite(tierPrice) || tierPrice < 0) {
        errors.push(`Valid price is required for ${tier}`)
      }
    })
  } else if (!Number.isFinite(payload.price) || payload.price < 0) {
    errors.push('Valid price is required')
  }

  if (!payload.images.length) errors.push('At least one preview image is required')

  if (payload.mediaType === MEDIA_TYPES.VIDEO) {
    if (!payload.demoVideo) errors.push('Demo video URL is required for video products')
    if (!payload.videoPoster) errors.push('Video poster is required for video products')
  }

  const hasMaster = Boolean(payload.masterVideoKey)
  const hasTierDelivery = [...payload.deliveryFiles.values()].some(
    (tier) => tier.videoKey?.trim() || tier.imageKeys?.some((key) => key?.trim()),
  )

  if (payload.mediaType === MEDIA_TYPES.VIDEO || payload.mediaType === MEDIA_TYPES.IMAGE) {
    if (!hasMaster && !hasTierDelivery) {
      errors.push(
        payload.mediaType === MEDIA_TYPES.VIDEO
          ? 'Master delivery video is required'
          : 'Master delivery image is required',
      )
    }

    if (hasMaster && !payload.masterVideoTier) {
      errors.push('Select the quality of the master delivery file')
    }

    if (
      hasMaster &&
      payload.masterVideoTier &&
      getTierRank(payload.masterVideoTier) < getTierRank(MIN_CUSTOMER_TIER)
    ) {
      errors.push(`Master quality must be ${MIN_CUSTOMER_TIER} or above`)
    }

    const aboveMaster = getTiersAboveMaster(
      payload.masterVideoTier,
      getAvailableTiers(payload),
    )
    if (hasMaster && payload.masterVideoTier && aboveMaster.length) {
      errors.push(
        `Cannot sell ${aboveMaster.join(', ')} — master file is only ${payload.masterVideoTier}.`,
      )
    }
  }

  if (errors.length) {
    const error = new Error(errors.join('. '))
    error.statusCode = 400
    throw error
  }

  return payload
}
