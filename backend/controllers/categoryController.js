import Category from '../models/Category.js'
import Product from '../models/Product.js'
import asyncHandler from '../utils/asyncHandler.js'

const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

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
