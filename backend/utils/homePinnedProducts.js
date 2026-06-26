import mongoose from 'mongoose'
import Product from '../models/Product.js'

export const HOME_PIN_LIMIT = 8

export const formatPinnedProduct = (product) => ({
  id: product._id.toString(),
  name: product.name,
  clipId: product.clipId || '',
  mediaType: product.mediaType || 'video',
  isActive: product.isActive,
  thumbnail: (product.images || []).find(Boolean) || product.videoPoster || '',
})

export const loadPinnedProductMap = async (idLists = []) => {
  const pinnedIds = [
    ...new Set(idLists.flatMap((ids) => (ids || []).map((id) => id.toString()))),
  ]

  if (pinnedIds.length === 0) {
    return new Map()
  }

  const products = await Product.find({ _id: { $in: pinnedIds } }).select(
    'name clipId images videoPoster mediaType isActive categorySlug',
  )

  return new Map(products.map((product) => [product._id.toString(), formatPinnedProduct(product)]))
}

export const serializePinnedProducts = (productIds = [], productMap = new Map()) =>
  (productIds || [])
    .map((id) => productMap.get(id.toString()))
    .filter(Boolean)
    .slice(0, HOME_PIN_LIMIT)

export const normalizePinnedProductIds = (rawIds = [], { limit = HOME_PIN_LIMIT } = {}) => {
  const uniqueIds = [...new Set(rawIds.map(String).filter(Boolean))]

  if (uniqueIds.length > limit) {
    return { error: `Maximum ${limit} products can be pinned` }
  }

  const validIds = uniqueIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
  if (validIds.length !== uniqueIds.length) {
    return { error: 'One or more product IDs are invalid' }
  }

  return { productIds: validIds }
}

export const validatePinnedProductsExist = async (
  productIds,
  { categorySlug = null } = {},
) => {
  if (productIds.length === 0) {
    return { productIds: [] }
  }

  const filter = { _id: { $in: productIds } }
  if (categorySlug) {
    filter.categorySlug = categorySlug
  }

  const products = await Product.find(filter).select('_id')
  const foundIdSet = new Set(products.map((product) => product._id.toString()))
  const orderedIds = productIds.filter((id) => foundIdSet.has(id))

  if (orderedIds.length !== productIds.length) {
    return {
      error: categorySlug
        ? 'Some products were not found or do not belong to this category'
        : 'Some products were not found',
    }
  }

  return { productIds: orderedIds }
}
