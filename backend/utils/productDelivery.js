import { MEDIA_TYPES } from '../constants/mediaTypes.js'
import AppError from './AppError.js'

const PURCHASE_UNAVAILABLE_MESSAGE =
  'This video is not available for purchase right now. Please try again later.'

const readDeliveryMap = (deliveryFiles) => {
  if (!deliveryFiles) return {}
  if (deliveryFiles instanceof Map) {
    return Object.fromEntries(deliveryFiles.entries())
  }
  return deliveryFiles
}

export const hasDeliverableMasterFile = (product) => {
  if (!product) return false

  if (product.masterVideoKey?.trim()) {
    return true
  }

  const deliveryMap = readDeliveryMap(product.deliveryFiles)

  for (const tier of Object.values(deliveryMap)) {
    if (product.mediaType === MEDIA_TYPES.VIDEO && tier?.videoKey?.trim()) {
      return true
    }

    if (tier?.imageKeys?.some((key) => key?.trim())) {
      return true
    }
  }

  return false
}

export const assertProductPurchasable = (product) => {
  if (!hasDeliverableMasterFile(product)) {
    throw new AppError(PURCHASE_UNAVAILABLE_MESSAGE, 400)
  }
}

export const PURCHASE_UNAVAILABLE_COPY = PURCHASE_UNAVAILABLE_MESSAGE
