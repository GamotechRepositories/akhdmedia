import Category from '../models/Category.js'
import Product from '../models/Product.js'
import asyncHandler from '../utils/asyncHandler.js'
import formatProduct, { buildCategoryMap } from '../utils/formatProduct.js'
import {
  normalizeProductPayload,
  validateProductPayload,
} from '../utils/normalizeProduct.js'
import {
  queueProductTranscode,
  shouldTranscodeProduct,
} from '../services/productTranscodeService.js'
import { sortTierList, getTiersUpToMaster, getAvailableTiers } from '../constants/resolutionTiers.js'

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

  const categoryMap = await getCategoryMap()
  const includeDelivery = req.query.admin === 'true'
  res.json(formatProduct(product, categoryMap, { includeDelivery }))
})

export const createProduct = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.body.categorySlug })
  if (!category) {
    res.status(400).json({ message: 'Invalid category selected' })
    return
  }

  const payload = validateProductPayload(normalizeProductPayload(req.body))

  if (payload.masterVideoKey) {
    payload.transcodeStatus = 'pending'
  }

  const product = await Product.create(payload)
  const categoryMap = await getCategoryMap()

  if (shouldTranscodeProduct(product)) {
    queueProductTranscode(product._id)
  }

  res.status(201).json(formatProduct(product, categoryMap, { includeDelivery: true }))
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

  const previousMasterKey = existing.masterVideoKey || ''
  const previousMasterTier = existing.masterVideoTier || ''
  const previousTiers = sortTierList(existing.availableTiers || [])
  const payload = validateProductPayload(normalizeProductPayload(req.body))

  if (payload.masterVideoKey && existing.mediaType === 'video') {
    const masterChanged = payload.masterVideoKey !== previousMasterKey
    const masterTierChanged = payload.masterVideoTier !== previousMasterTier
    const tiersChanged =
      JSON.stringify(sortTierList(payload.availableTiers)) !==
      JSON.stringify(previousTiers)

    if (!masterChanged && !masterTierChanged && !tiersChanged) {
      payload.deliveryFiles = existing.deliveryFiles
      payload.transcodeStatus = existing.transcodeStatus
      payload.transcodeError = existing.transcodeError
    } else {
      payload.transcodeStatus = 'pending'
      payload.transcodeError = ''
    }
  }

  const product = await Product.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  })

  if (shouldTranscodeProduct(product, previousMasterKey, previousTiers, previousMasterTier)) {
    queueProductTranscode(product._id)
  }

  const categoryMap = await getCategoryMap()
  res.json(formatProduct(product, categoryMap, { includeDelivery: true }))
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

export const getTranscodeStatus = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean()
  if (!product) {
    res.status(404).json({ message: 'Product not found' })
    return
  }

  const categoryMap = await getCategoryMap()
  const deliverableTiers = getTiersUpToMaster(
    product.masterVideoTier,
    getAvailableTiers(product),
  )

  res.json({
    success: true,
    data: {
      transcodeStatus: product.transcodeStatus || 'idle',
      transcodeError: product.transcodeError || '',
      masterVideoKey: product.masterVideoKey || '',
      masterVideoFilename: product.masterVideoFilename || '',
      masterVideoTier: product.masterVideoTier || '',
      deliverableTiers,
      deliveryFiles: formatProduct(product, categoryMap, { includeDelivery: true }).deliveryFiles,
    },
  })
})

export const retriggerTranscode = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) {
    res.status(404).json({ message: 'Product not found' })
    return
  }

  if (!product.masterVideoKey) {
    res.status(400).json({ message: 'No master video uploaded for this product' })
    return
  }

  if (!product.masterVideoTier) {
    res.status(400).json({ message: 'Master video quality is not set for this product' })
    return
  }

  await Product.findByIdAndUpdate(product._id, {
    transcodeStatus: 'pending',
    transcodeError: '',
  })

  queueProductTranscode(product._id)

  res.json({
    success: true,
    message: 'Transcoding started',
  })
})
