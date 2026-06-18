import Actor from '../models/Actor.js'
import Product from '../models/Product.js'
import asyncHandler from '../utils/asyncHandler.js'

const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const parseSearchKeywords = (value) => {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))]
  }

  return [...new Set(String(value || '').split(',').map((item) => item.trim()).filter(Boolean))]
}

const parseSortOrder = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return 0
  return Number.parseInt(digits, 10)
}

const buildActorPayload = (body = {}) => {
  const name = body.name?.trim()
  const slug = slugify(body.slug || name)

  return {
    name,
    slug,
    searchKeywords: parseSearchKeywords(body.searchKeywords),
    image: body.image?.trim() || '',
    sortOrder: parseSortOrder(body.sortOrder),
    isActive: body.isActive !== false,
  }
}

export const getPublicActors = asyncHandler(async (req, res) => {
  const actors = await Actor.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean()

  res.json(
    actors.map((actor) => ({
      id: actor._id.toString(),
      name: actor.name,
      slug: actor.slug,
      image: actor.image || '',
      sortOrder: actor.sortOrder ?? 0,
    })),
  )
})

export const getActors = asyncHandler(async (req, res) => {
  const actors = await Actor.find().sort({ sortOrder: 1, createdAt: 1 })
  res.json(actors)
})

export const getActorById = asyncHandler(async (req, res) => {
  const actor = await Actor.findById(req.params.id)
  if (!actor) {
    res.status(404).json({ message: 'Actor not found' })
    return
  }
  res.json(actor)
})

export const createActor = asyncHandler(async (req, res) => {
  const payload = buildActorPayload(req.body)

  if (!payload.name) {
    res.status(400).json({ message: 'Actor name is required' })
    return
  }

  if (!payload.slug) {
    res.status(400).json({ message: 'Actor slug is required' })
    return
  }

  const existing = await Actor.findOne({ slug: payload.slug })
  if (existing) {
    res.status(400).json({ message: 'An actor with this slug already exists' })
    return
  }

  const actor = await Actor.create(payload)
  res.status(201).json(actor)
})

export const updateActor = asyncHandler(async (req, res) => {
  const payload = buildActorPayload(req.body)

  if (!payload.name) {
    res.status(400).json({ message: 'Actor name is required' })
    return
  }

  if (payload.slug) {
    const conflict = await Actor.findOne({
      slug: payload.slug,
      _id: { $ne: req.params.id },
    })
    if (conflict) {
      res.status(400).json({ message: 'An actor with this slug already exists' })
      return
    }
  }

  const actor = await Actor.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  })

  if (!actor) {
    res.status(404).json({ message: 'Actor not found' })
    return
  }

  await Product.updateMany(
    { actorId: actor._id },
    {
      actorName: actor.name,
      actorSearchKeywords: actor.searchKeywords || [],
    },
  )

  res.json(actor)
})

export const deleteActor = asyncHandler(async (req, res) => {
  const actor = await Actor.findById(req.params.id)
  if (!actor) {
    res.status(404).json({ message: 'Actor not found' })
    return
  }

  await actor.deleteOne()
  res.json({ message: 'Actor deleted successfully' })
})
