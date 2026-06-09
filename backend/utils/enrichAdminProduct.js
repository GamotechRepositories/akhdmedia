import { getPrivateDownloadUrl, toAbsolutePrivateUrl } from '../services/storageService.js'
import formatProduct from './formatProduct.js'

export const enrichAdminProduct = async (product, categoryMap, options = {}) => {
  const formatted = formatProduct(product, categoryMap, options)

  if (!options.includeDelivery || !formatted.masterVideoKey) {
    return formatted
  }

  const accessUrl = await getPrivateDownloadUrl(
    formatted.masterVideoKey,
    formatted.masterVideoFilename,
    { inline: true },
  )

  formatted.masterVideoUrl = toAbsolutePrivateUrl(accessUrl)
  return formatted
}

export const enrichAdminProducts = async (products, categoryMap, options = {}) =>
  Promise.all(products.map((product) => enrichAdminProduct(product, categoryMap, options)))
