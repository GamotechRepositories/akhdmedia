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
const getCategoryMap = async () => {
  const categories = await Category.find()
  return buildCategoryMap(categories)
}

export const getProducts = asyncHandler(async (req, res) => {
  const filter = req.query.admin === 'true' ? {} : { isActive: true }

  if (req.query.categorySlug) {
    filter.categorySlug = req.query.categorySlug
  }

  if (req.query.subCategorySlug) {
    filter.subCategorySlug = req.query.subCategorySlug
  }

  const products = await Product.find(filter).sort({ createdAt: -1 })

  for (const product of products) {
    if (!product.clipId) {
      product.clipId = await generateClipId()
      await product.save()
    }
  }

  const categoryMap = await getCategoryMap()

  const includeDelivery = req.query.admin === 'true'
  res.json(
    products.map((product) =>
      formatProduct(product, categoryMap, { includeDelivery }),
    ),
  )
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

  const payload = validateProductPayload(normalizeProductPayload(req.body))
  payload.clipId = await resolveClipId(payload.clipId)
  await assertClipIdAvailable(payload.clipId)

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

  const payload = validateProductPayload(normalizeProductPayload(req.body))
  payload.clipId = await resolveClipId(payload.clipId, existing.clipId || '')
  await assertClipIdAvailable(payload.clipId, existing._id.toString())

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
