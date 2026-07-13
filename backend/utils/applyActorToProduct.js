import Actor from '../models/Actor.js'
import Product from '../models/Product.js'
import AppError from './AppError.js'

const normalizeActorIds = (body = {}) => {
  const fromArray = Array.isArray(body.actorIds)
    ? body.actorIds.map((item) => String(item || '').trim()).filter(Boolean)
    : []

  const legacyActorId = String(body.actorId || '').trim()
  const merged = legacyActorId ? [...fromArray, legacyActorId] : fromArray

  return [...new Set(merged)]
}

const buildActorFields = (actors) => {
  const keywordSet = new Set()

  actors.forEach((actor) => {
    ;(actor.searchKeywords || []).forEach((keyword) => {
      const value = String(keyword || '').trim()
      if (value) keywordSet.add(value)
    })
  })

  const actorIds = actors.map((actor) => actor._id)
  const actorNames = actors.map((actor) => actor.name)

  return {
    actorIds,
    actorNames,
    actorId: actorIds[0] || null,
    actorName: actorNames.join(', '),
    actorSearchKeywords: [...keywordSet],
  }
}

export const applyActorSelection = async (payload, body = {}) => {
  const actorIds = normalizeActorIds(body)

  if (!actorIds.length) {
    payload.actorIds = []
    payload.actorNames = []
    payload.actorId = null
    payload.actorName = ''
    payload.actorSearchKeywords = []
    return payload
  }

  const actors = await Actor.find({ _id: { $in: actorIds } })
  if (actors.length !== actorIds.length) {
    throw new AppError('One or more selected actors were not found', 400)
  }

  const actorById = new Map(actors.map((actor) => [actor._id.toString(), actor]))
  const orderedActors = actorIds.map((id) => actorById.get(id)).filter(Boolean)

  Object.assign(payload, buildActorFields(orderedActors))
  return payload
}

export const syncProductsForActor = async (actor) => {
  const products = await Product.find({
    $or: [{ actorId: actor._id }, { actorIds: actor._id }],
  })

  if (!products.length) return

  const actorIdSet = new Set(
    products.flatMap((product) =>
      product.actorIds?.length
        ? product.actorIds.map((id) => id.toString())
        : product.actorId
          ? [product.actorId.toString()]
          : [],
    ),
  )

  const relatedActors = await Actor.find({ _id: { $in: [...actorIdSet] } })
  const actorMap = new Map(relatedActors.map((item) => [item._id.toString(), item]))

  await Promise.all(
    products.map(async (product) => {
      const productActorIds = product.actorIds?.length
        ? product.actorIds.map((id) => id.toString())
        : product.actorId
          ? [product.actorId.toString()]
          : []

      const orderedActors = productActorIds
        .map((id) => actorMap.get(id))
        .filter(Boolean)

      Object.assign(product, buildActorFields(orderedActors))
      await product.save()
    }),
  )
}
