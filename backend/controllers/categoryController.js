import Category from '../models/Category.js'
import Product from '../models/Product.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  HOME_PIN_LIMIT,
  loadPinnedProductMap,
  normalizePinnedProductIds,
  serializePinnedProducts,
  validatePinnedProductsExist,
} from '../utils/homePinnedProducts.js'
import { getSiteSettings } from '../services/siteSettingsService.js'

const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const serializeCategoryPins = (category, productMap, productCount = 0) => ({
  id: category._id.toString(),
  slug: category.slug,
  label: category.breadcrumb,
  navLabel: category.navLabel,
  isActive: category.isActive,
  sortOrder: category.sortOrder ?? 0,
  productCount,
  pinnedProducts: serializePinnedProducts(category.homePinnedProductIds, productMap),
})

const loadCategoryProductCounts = async (categories = []) => {
  const slugs = categories.map((category) => category.slug).filter(Boolean)
  if (slugs.length === 0) {
    return {}
  }

  const counts = await Product.aggregate([
    { $match: { categorySlug: { $in: slugs } } },
    { $group: { _id: '$categorySlug', count: { $sum: 1 } } },
  ])

  return Object.fromEntries(counts.map((entry) => [entry._id, entry.count]))
}

export const getHomeCategoryPins = asyncHandler(async (req, res) => {
  const [categories, settings] = await Promise.all([
    Category.find({}).sort({ sortOrder: 1, navLabel: 1 }),
    getSiteSettings(),
  ])

  const [productMap, countBySlug, totalProductCount] = await Promise.all([
    loadPinnedProductMap([
      ...categories.map((category) => category.homePinnedProductIds),
      settings.homeLatestProductIds,
    ]),
    loadCategoryProductCounts(categories),
    Product.countDocuments({ showInLatest: true }),
  ])

  res.json({
    data: categories.map((category) =>
      serializeCategoryPins(category, productMap, countBySlug[category.slug] || 0),
    ),
    latest: {
      title: 'Latest Uploads',
      productCount: totalProductCount,
      pinnedProducts: serializePinnedProducts(settings.homeLatestProductIds, productMap),
    },
  })
})

export const updateCategoryHomePins = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) {
    res.status(404).json({ message: 'Category not found' })
    return
  }

  const normalized = normalizePinnedProductIds(req.body.productIds, { limit: HOME_PIN_LIMIT })
  if (normalized.error) {
    res.status(400).json({ message: normalized.error })
    return
  }

  const validated = await validatePinnedProductsExist(normalized.productIds, {
    categorySlug: category.slug,
  })
  if (validated.error) {
    res.status(400).json({ message: validated.error })
    return
  }

  category.homePinnedProductIds = validated.productIds
  await category.save()

  const productMap = await loadPinnedProductMap([category.homePinnedProductIds])
  const countBySlug = await loadCategoryProductCounts([category])

  res.json({
    data: serializeCategoryPins(
      category,
      productMap,
      countBySlug[category.slug] || 0,
    ),
  })
})

export const getCategories = asyncHandler(async (req, res) => {
  const filter = req.query.admin === 'true' ? {} : { isActive: true }
  const categories = await Category.find(filter).sort({ sortOrder: 1, navLabel: 1 })
  res.json(categories)
})

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) {
    res.status(404).json({ message: 'Category not found' })
    return
  }
  res.json(category)
})

export const createCategory = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    slug: slugify(req.body.slug || req.body.navLabel || req.body.breadcrumb),
    subCategories: (req.body.subCategories || []).map((item) => ({
      slug: slugify(item.slug || item.name),
      name: item.name?.trim(),
    })),
  }

  const category = await Category.create(payload)
  res.status(201).json(category)
})

export const updateCategory = asyncHandler(async (req, res) => {
  const updates = { ...req.body }

  if (updates.slug) {
    updates.slug = slugify(updates.slug)
  }

  if (updates.subCategories) {
    updates.subCategories = updates.subCategories.map((item) => ({
      slug: slugify(item.slug || item.name),
      name: item.name?.trim(),
    }))
  }

  const category = await Category.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })

  if (!category) {
    res.status(404).json({ message: 'Category not found' })
    return
  }

  res.json(category)
})

export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
  if (!category) {
    res.status(404).json({ message: 'Category not found' })
    return
  }

  const linkedProducts = await Product.countDocuments({
    categorySlug: category.slug,
  })

  if (linkedProducts > 0) {
    res.status(400).json({
      message: `Cannot delete category. ${linkedProducts} product(s) are linked to it.`,
    })
    return
  }

  await category.deleteOne()
  res.json({ message: 'Category deleted successfully' })
})
