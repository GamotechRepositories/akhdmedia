import Category from '../models/Category.js'
import Product from '../models/Product.js'
import mongoose from 'mongoose'
import asyncHandler from '../utils/asyncHandler.js'
import formatProduct, { buildCategoryMap } from '../utils/formatProduct.js'
import {
  assertClipIdAvailable,
  generateClipId,
  resolveClipId,
} from '../utils/licenseIds.js'
import {
  normalizeProductPayload,
  validateProductPayload,
} from '../utils/normalizeProduct.js'
import { enrichAdminProduct } from '../utils/enrichAdminProduct.js'
import { attachMasterVideoSignedUrl } from '../utils/attachMasterVideoSignedUrl.js'
import { applyActorSelection } from '../utils/applyActorToProduct.js'
import { cleanupReplacedProductDemoMedia } from '../services/storageService.js'
import { getProductSalesStatsMap, getProductSalesStats } from '../utils/productSales.js'
import {
  ADMIN_PERMISSIONS,
  hasAdminPermission,
} from '../constants/adminPermissions.js'
import { PURCHASE_TYPES, buildAppleProductId } from '../constants/purchaseTypes.js'
import {
  applyAscSyncResultToProduct,
  markAscSyncError,
  syncProductToAppStoreConnect,
} from '../services/appStoreConnectIapService.js'

const applyAppleIapFields = (product) => {
  if (!product) return product
  product.purchaseType = PURCHASE_TYPES.APPLE_IAP
  product.appleProductId = buildAppleProductId(product._id, product.mediaType)
  if (!product.appleAscSyncStatus) {
    product.appleAscSyncStatus = 'pending'
  }
  return product
}

const syncAppleIapWithAsc = async (product) => {
  try {
    const result = await syncProductToAppStoreConnect(product)
    await applyAscSyncResultToProduct(product, result)
  } catch (error) {
    console.error(
      `[asc-iap] Failed to sync ${product?.clipId || product?._id}:`,
      error?.message || error,
    )
    await markAscSyncError(product, error)
  }
  return product
}
const PUBLIC_CATALOG_CACHE_MS = 2 * 60 * 1000
const HEAVY_PRODUCT_FIELDS =
  '-deliveryFiles -masterVideoSignedUrl -masterVideoFilename -masterVideoTier'

let publicCatalogCache = { key: '', data: null, fetchedAt: 0 }

export const invalidatePublicCatalogCache = () => {
  publicCatalogCache = { key: '', data: null, fetchedAt: 0 }
}

const getCategoryMap = async () => {
  const categories = await Category.find().lean()
  return buildCategoryMap(categories)
}

const buildListQuery = (filter, { excludeHeavyFields = false, sort = { createdAt: -1 } } = {}) => {
  let query = Product.find(filter).sort(sort)

  if (excludeHeavyFields) {
    query = query.select(HEAVY_PRODUCT_FIELDS)
  }

  return query.lean()
}

const parseListParam = (value) => {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean)
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }

  return []
}

const appendSearchFilter = (filter, search = '') => {
  const tokens = String(search || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (!tokens.length) return

  const searchFields = [
    'name',
    'clipId',
    'categorySlug',
    'subCategorySlug',
    'brand',
    'description',
    'actorName',
    'actorNames',
    'actorSearchKeywords',
  ]

  const tokenFilters = tokens.map((token) => {
    const regex = new RegExp(escapeRegex(token), 'i')
    return {
      $or: searchFields.map((field) => ({ [field]: regex })),
    }
  })

  if (tokenFilters.length) {
    filter.$and = [...(filter.$and || []), ...tokenFilters]
  }
}

const buildPublicListFilter = (query = {}) => {
  const filter = { isActive: true }

  if (query.categorySlug) {
    filter.categorySlug = query.categorySlug
  }

  if (query.subCategorySlug) {
    filter.subCategorySlug = query.subCategorySlug
  }

  if (query.actorId && mongoose.Types.ObjectId.isValid(query.actorId)) {
    const actorObjectId = new mongoose.Types.ObjectId(query.actorId)
    filter.$or = [{ actorIds: actorObjectId }, { actorId: actorObjectId }]
  }

  const brands = parseListParam(query.brands)
  if (brands.length) {
    filter.brand = { $in: brands }
  }

  const fpsValues = parseListParam(query.fps)
  if (fpsValues.length) {
    filter['videoInfo.fps'] = { $in: fpsValues }
  }

  const resolutions = parseListParam(query.resolutions)
  if (resolutions.length) {
    filter.availableTiers = { $in: resolutions }
  }

  const priceMin = Number.parseFloat(query.priceMin)
  const priceMax = Number.parseFloat(query.priceMax)
  if (Number.isFinite(priceMin) || Number.isFinite(priceMax)) {
    filter.price = {}
    if (Number.isFinite(priceMin)) filter.price.$gte = priceMin
    if (Number.isFinite(priceMax)) filter.price.$lte = priceMax
  }

  appendSearchFilter(filter, query.search)

  return filter
}

const buildPublicSort = (query = {}) => {
  const sortBy = String(query.sortBy || 'default')

  switch (sortBy) {
    case 'price-low-high':
      return { price: 1, createdAt: -1 }
    case 'price-high-low':
      return { price: -1, createdAt: -1 }
    case 'newest':
      return { createdAt: -1 }
    default:
      if (query.actorId) {
        return { actorListingOrder: 1, createdAt: -1 }
      }
      if (query.categorySlug) {
        return { categoryListingOrder: 1, createdAt: -1 }
      }
      return { createdAt: -1 }
  }
}

const orderProductsByIds = (products = [], ids = []) => {
  const productMap = new Map(products.map((product) => [product._id.toString(), product]))
  return ids.map((id) => productMap.get(String(id))).filter(Boolean)
}

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const buildAdminListFilter = (query = {}) => {
  const filter = {}

  if (query.mediaType && query.mediaType !== 'all') {
    filter.mediaType = query.mediaType
  }

  if (query.categorySlug && query.categorySlug !== 'all') {
    filter.categorySlug = query.categorySlug
  }

  if (query.status === 'active') {
    filter.isActive = true
  } else if (query.status === 'inactive') {
    filter.isActive = false
  }

  if (query.showInLatest === 'true') {
    filter.showInLatest = true
  }

  const search = String(query.search || '').trim()
  if (search) {
    appendSearchFilter(filter, search)
  }

  return filter
}

const backfillMissingClipIds = async () => {
  const missing = await Product.find({
    $or: [{ clipId: null }, { clipId: '' }],
  }).limit(10)

  for (const product of missing) {
    product.clipId = await generateClipId()
    await product.save()
  }
}

const formatProductList = (
  products,
  categoryMap,
  includeDelivery,
  salesMap = null,
  { includePricing = true } = {},
) =>
  products.map((product) => {
    const formatted = formatProduct(product, categoryMap, { includeDelivery })
    if (!includePricing) {
      delete formatted.price
      delete formatted.resolutionPricing
      delete formatted.imageSizes
      delete formatted.gstPercentage
    }
    if (salesMap) {
      const stats = getProductSalesStats(salesMap, product._id.toString())
      formatted.soldCount = stats.soldCount
      formatted.totalRevenue = stats.totalRevenue
    }
    return formatted
  })

export const reserveClipId = asyncHandler(async (req, res) => {
  const clipId = await generateClipId()
  res.json({ clipId })
})

export const getProducts = asyncHandler(async (req, res) => {
  const isAdmin = req.query.admin === 'true'
  const canViewSales =
    isAdmin && hasAdminPermission(req.adminProfile, ADMIN_PERMISSIONS.PRODUCTS_SALES_VIEW)
  const page = Number.parseInt(req.query.page, 10)
  const limit = Number.parseInt(req.query.limit, 10)
  const wantsPagination = Number.isFinite(page) && page > 0 && Number.isFinite(limit) && limit > 0
  const useAdminPagination = isAdmin && wantsPagination
  const usePublicPagination = !isAdmin && wantsPagination
  const salesSort =
    canViewSales && ['top', 'low', 'revenue'].includes(req.query.sales)
      ? req.query.sales
      : 'all'

  const requestedIds = parseListParam(req.query.ids)
  if (!isAdmin && requestedIds.length) {
    const validIds = requestedIds.filter((id) => mongoose.Types.ObjectId.isValid(id))
    const [products, categoryMap] = await Promise.all([
      buildListQuery(
        { _id: { $in: validIds }, isActive: true },
        { excludeHeavyFields: true },
      ),
      getCategoryMap(),
    ])

    const ordered = orderProductsByIds(products, validIds)
    res.json(formatProductList(ordered, categoryMap, false, null, { includePricing: true }))
    return
  }

  if (usePublicPagination) {
    const safeLimit = Math.min(Math.max(limit, 1), 60)
    const filter = buildPublicListFilter(req.query)
    const sort = buildPublicSort(req.query)
    const skip = (page - 1) * safeLimit

    const [products, total, categoryMap] = await Promise.all([
      buildListQuery(filter, { excludeHeavyFields: true, sort }).skip(skip).limit(safeLimit),
      Product.countDocuments(filter),
      getCategoryMap(),
    ])

    res.json({
      products: formatProductList(products, categoryMap, false, null, { includePricing: true }),
      pagination: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
    })
    return
  }

  if (useAdminPagination) {
    const safeLimit = Math.min(Math.max(limit, 1), 100)
    const filter = buildAdminListFilter(req.query)
    const skip = (page - 1) * safeLimit
    const listOptions = { includePricing: canViewSales }

    if (salesSort !== 'all') {
      const [allProducts, total, categoryMap, salesMap] = await Promise.all([
        buildListQuery(filter),
        Product.countDocuments(filter),
        getCategoryMap(),
        getProductSalesStatsMap(),
      ])

      backfillMissingClipIds().catch(() => {})

      const sorted = [...allProducts].sort((a, b) => {
        const aStats = getProductSalesStats(salesMap, a._id.toString())
        const bStats = getProductSalesStats(salesMap, b._id.toString())

        if (salesSort === 'revenue') {
          if (aStats.totalRevenue !== bStats.totalRevenue) {
            return bStats.totalRevenue - aStats.totalRevenue
          }
          if (aStats.soldCount !== bStats.soldCount) {
            return bStats.soldCount - aStats.soldCount
          }
        } else {
          const aSold = aStats.soldCount
          const bSold = bStats.soldCount
          if (aSold !== bSold) {
            return salesSort === 'top' ? bSold - aSold : aSold - bSold
          }
          if (aStats.totalRevenue !== bStats.totalRevenue) {
            return salesSort === 'top'
              ? bStats.totalRevenue - aStats.totalRevenue
              : aStats.totalRevenue - bStats.totalRevenue
          }
        }

        return new Date(b.createdAt) - new Date(a.createdAt)
      })

      const pageProducts = sorted.slice(skip, skip + safeLimit)

      res.json({
        data: {
          products: formatProductList(
            pageProducts,
            categoryMap,
            true,
            salesMap,
            listOptions,
          ),
          pagination: {
            page,
            limit: safeLimit,
            total,
            totalPages: Math.max(1, Math.ceil(total / safeLimit)),
          },
        },
      })
      return
    }

    const [products, total, categoryMap] = await Promise.all([
      buildListQuery(filter).skip(skip).limit(safeLimit),
      Product.countDocuments(filter),
      getCategoryMap(),
    ])

    backfillMissingClipIds().catch(() => {})

    const salesMap = canViewSales
      ? await getProductSalesStatsMap(products.map((product) => product._id.toString()))
      : null

    res.json({
      data: {
        products: formatProductList(products, categoryMap, true, salesMap, listOptions),
        pagination: {
          page,
          limit: safeLimit,
          total,
          totalPages: Math.max(1, Math.ceil(total / safeLimit)),
        },
      },
    })
    return
  }

  const filter = isAdmin ? {} : { isActive: true }

  if (req.query.categorySlug) {
    filter.categorySlug = req.query.categorySlug
  }

  if (req.query.subCategorySlug) {
    filter.subCategorySlug = req.query.subCategorySlug
  }

  const excludeHeavyFields = !isAdmin
  const cacheKey = JSON.stringify(filter)

  if (!isAdmin && !canViewSales) {
    const cached = publicCatalogCache
    if (
      cached.key === cacheKey &&
      cached.data &&
      Date.now() - cached.fetchedAt < PUBLIC_CATALOG_CACHE_MS
    ) {
      res.json(cached.data)
      return
    }
  }

  const [products, categoryMap, salesMap] = await Promise.all([
    buildListQuery(filter, { excludeHeavyFields }),
    getCategoryMap(),
    canViewSales ? getProductSalesStatsMap() : Promise.resolve(null),
  ])

  backfillMissingClipIds().catch(() => {})

  const formatted = formatProductList(products, categoryMap, isAdmin, salesMap, {
    includePricing: !isAdmin || canViewSales,
  })

  if (!isAdmin && !canViewSales) {
    publicCatalogCache = {
      key: cacheKey,
      data: formatted,
      fetchedAt: Date.now(),
    }
  }

  res.json(formatted)
})

export const getProductById = asyncHandler(async (req, res) => {
  const isAdminRequest = req.query.admin === 'true'
  const product = isAdminRequest
    ? await Product.findById(req.params.id)
    : await Product.findById(req.params.id).select(HEAVY_PRODUCT_FIELDS).lean()
  if (!product) {
    res.status(404).json({ message: 'Product not found' })
    return
  }

  if (!product.clipId) {
    const clipId = await generateClipId()
    await Product.findByIdAndUpdate(req.params.id, { clipId })
    product.clipId = clipId
  }

  const categoryMap = await getCategoryMap()
  if (isAdminRequest) {
    res.json(await enrichAdminProduct(product, categoryMap, { includeDelivery: true }))
    return
  }

  res.json(formatProduct(product, categoryMap, { includeDelivery: false }))
})

export const createProduct = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.body.categorySlug })
  if (!category) {
    res.status(400).json({ message: 'Invalid category selected' })
    return
  }

  const payload = validateProductPayload(
    await applyActorSelection(normalizeProductPayload(req.body), req.body),
  )
  payload.clipId = await resolveClipId(payload.clipId)
  await assertClipIdAvailable(payload.clipId)
  await attachMasterVideoSignedUrl(payload)

  const product = await Product.create(payload)
  applyAppleIapFields(product)
  await product.save()
  await syncAppleIapWithAsc(product)
  invalidatePublicCatalogCache()
  const categoryMap = await getCategoryMap()

  res.status(201).json(
    await enrichAdminProduct(product, categoryMap, { includeDelivery: true }),
  )
})

export const updateProduct = asyncHandler(async (req, res) => {
  if (req.body.categorySlug) {
    const category = await Category.findOne({ slug: req.body.categorySlug })
    if (!category) {
      res.status(400).json({ message: 'Invalid category selected' })
      return
    }
  }

  const existing = await Product.findById(req.params.id)
  if (!existing) {
    res.status(404).json({ message: 'Product not found' })
    return
  }

  const payload = validateProductPayload(
    await applyActorSelection(normalizeProductPayload(req.body), req.body),
  )
  payload.clipId = await resolveClipId(payload.clipId, existing.clipId || '')
  await assertClipIdAvailable(payload.clipId, existing._id.toString())
  await attachMasterVideoSignedUrl(payload)
  await cleanupReplacedProductDemoMedia(existing, payload)

  const product = await Product.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  })

  if (product) {
    applyAppleIapFields(product)
    await product.save()
    if (product.appleAscSyncStatus !== 'synced' || !product.appleAscIapId) {
      await syncAppleIapWithAsc(product)
    }
  }

  invalidatePublicCatalogCache()
  const categoryMap = await getCategoryMap()
  res.json(await enrichAdminProduct(product, categoryMap, { includeDelivery: true }))
})

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) {
    res.status(404).json({ message: 'Product not found' })
    return
  }

  await product.deleteOne()
  invalidatePublicCatalogCache()
  res.json({ message: 'Product deleted successfully' })
})
