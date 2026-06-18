import Actor from '../models/Actor.js'
import AppError from './AppError.js'

export const applyActorSelection = async (payload, actorIdRaw) => {
  const actorId = String(actorIdRaw || '').trim()

  if (!actorId) {
    payload.actorId = null
    payload.actorName = ''
    payload.actorSearchKeywords = []
    return payload
  }

  const actor = await Actor.findById(actorId)
  if (!actor) {
    throw new AppError('Selected actor not found', 400)
  }

  payload.actorId = actor._id
  payload.actorName = actor.name
  payload.actorSearchKeywords = actor.searchKeywords || []
  return payload
}
