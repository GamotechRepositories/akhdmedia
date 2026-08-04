import Category from '../models/Category.js'
import Product from '../models/Product.js'
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
const getCategoryMap = async () => {
  const categories = await Category.find()
  return buildCategoryMap(categories)
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
    const tokens = search.split(/\s+/).filter(Boolean)
    const searchFields = [
      'name',
      'clipId',
      'categorySlug',
      'subCategorySlug',
      'brand',
      'description',
    ]

    const tokenFilters = tokens.map((token) => {
      const regex = new RegExp(escapeRegex(token), 'i')
      return {
        $or: searchFields.map((field) => ({ [field]: regex })),
      }
    })

    if (tokenFilters.length) {
      filter.$and = tokenFilters
    }
  }

  return filter
}

const ensureClipIds = async (products = []) => {
  for (const product of products) {
    if (!product.clipId) {
      product.clipId = await generateClipId()
      await product.save()
    }
  }
}

const formatProductList = (products, categoryMap, includeDelivery, salesMap = null) =>
  products.map((product) => {
    const formatted = formatProduct(product, categoryMap, { includeDelivery })
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
  const page = Number.parseInt(req.query.page, 10)
  const limit = Number.parseInt(req.query.limit, 10)
  const usePagination =
    isAdmin && Number.isFinite(page) && page > 0 && Number.isFinite(limit) && limit > 0
  const salesSort = ['top', 'low', 'revenue'].includes(req.query.sales)
    ? req.query.sales
    : 'all'

  if (usePagination) {
    const safeLimit = Math.min(Math.max(limit, 1), 100)
    const filter = buildAdminListFilter(req.query)
    const skip = (page - 1) * safeLimit

    if (salesSort !== 'all') {
      const [allProducts, total, categoryMap, salesMap] = await Promise.all([
        Product.find(filter).sort({ createdAt: -1 }),
        Product.countDocuments(filter),
        getCategoryMap(),
        getProductSalesStatsMap(),
      ])

      await ensureClipIds(allProducts)

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
          products: formatProductList(pageProducts, categoryMap, true, salesMap),
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
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
      Product.countDocuments(filter),
      getCategoryMap(),
    ])

    await ensureClipIds(products)

    const salesMap = await getProductSalesStatsMap(
      products.map((product) => product._id.toString()),
    )

    res.json({
      data: {
        products: formatProductList(products, categoryMap, true, salesMap),
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

  const products = await Product.find(filter).sort({ createdAt: -1 })

  await ensureClipIds(products)

  const categoryMap = await getCategoryMap()
  const salesMap = isAdmin ? await getProductSalesStatsMap() : null

  res.json(formatProductList(products, categoryMap, isAdmin, salesMap))
})

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) {
    res.status(404).json({ message: 'Product not found' })
    return
  }

  if (!product.clipId) {
    product.clipId = await generateClipId()
    await product.save()
  }

  const categoryMap = await getCategoryMap()
  const includeDelivery = req.query.admin === 'true'
  if (includeDelivery) {
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
  res.json({ message: 'Product deleted successfully' })
})
