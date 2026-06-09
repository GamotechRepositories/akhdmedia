import Product from '../models/Product.js'
import AppError from '../utils/AppError.js'
import { getFilenameFromKey, getPrivateDownloadUrl } from './storageService.js'

const resolveDownloadFilename = (storedFilename, key, fallback) =>
  storedFilename || getFilenameFromKey(key) || fallback

const readDeliveryMap = (deliveryFiles) => {
  if (!deliveryFiles) return {}
  if (deliveryFiles instanceof Map) {
    return Object.fromEntries(deliveryFiles.entries())
  }
  return deliveryFiles
}

const getTierDelivery = (product, imageSize) => {
  const deliveryMap = readDeliveryMap(product.deliveryFiles)
  return deliveryMap[imageSize] || null
}

export const getOrderItemDownloads = async (order) => {
  const downloads = []

  for (const item of order.items) {
    const product = await Product.findById(item.productId).lean()
    if (!product) continue

    const tier = getTierDelivery(product, item.imageSize)
    if (!tier) {
      downloads.push({
        productId: item.productId,
        name: item.name,
        imageSize: item.imageSize,
        files: [],
        message: 'Delivery files not yet available for this resolution',
      })
      continue
    }

    const files = []

    if (tier.videoKey) {
      const downloadName = resolveDownloadFilename(
        tier.videoFilename,
        tier.videoKey,
        `${item.name}-${item.imageSize}.mp4`,
      )
      const url = await getPrivateDownloadUrl(tier.videoKey, downloadName)
      files.push({
        type: 'video',
        label: downloadName,
        url,
      })
    }

    if (tier.imageKeys?.length) {
      for (let i = 0; i < tier.imageKeys.length; i += 1) {
        const imageKey = tier.imageKeys[i]
        if (!imageKey) continue
        const downloadName = resolveDownloadFilename(
          tier.imageFilenames?.[i],
          imageKey,
          `${item.name}-${item.imageSize}-image-${i + 1}.jpg`,
        )
        const url = await getPrivateDownloadUrl(imageKey, downloadName)
        files.push({
          type: 'image',
          label: downloadName,
          url,
        })
      }
    }

    downloads.push({
      productId: item.productId,
      name: item.name,
      imageSize: item.imageSize,
      files,
    })
  }

  return downloads
}

export const verifyOrderAccess = (order, sessionId) => {
  if (!order) throw new AppError('Order not found', 404)
  if (order.sessionId !== sessionId) throw new AppError('Order not found', 404)
}
