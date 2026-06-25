import { getPrivateDownloadUrl, listPublicProductPreviewUrls, toAbsolutePrivateUrl } from '../services/storageService.js'
import formatProduct from './formatProduct.js'
import { resolveAdminPreviewImages } from './discoverPreviewImages.js'

export const enrichAdminProduct = async (product, categoryMap, options = {}) => {
  const formatted = formatProduct(product, categoryMap, options)

  if (options.includeDelivery) {
    const hasAllStoredPreviews = [0, 1, 2].every((index) => product.images?.[index]?.trim())
    let discovered = ['', '', '']

    if (!hasAllStoredPreviews) {
      discovered = await listPublicProductPreviewUrls(product.clipId)
    }

    formatted.images = resolveAdminPreviewImages(product, discovered)
  }

  if (!options.includeDelivery || !formatted.masterVideoKey) {
    return formatted
  }

  try {
    const accessUrl = await getPrivateDownloadUrl(
      formatted.masterVideoKey,
      formatted.masterVideoFilename,
      { inline: true },
    )

    formatted.masterVideoUrl = toAbsolutePrivateUrl(accessUrl)
  } catch (error) {
    console.warn(
      `[admin-product] Could not sign master video URL for ${product.clipId}:`,
      error?.message || error,
    )
  }

  return formatted
}

export const enrichAdminProducts = async (products, categoryMap, options = {}) =>
  Promise.all(products.map((product) => enrichAdminProduct(product, categoryMap, options)))
