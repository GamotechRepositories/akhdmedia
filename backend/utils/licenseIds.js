import AppError from './AppError.js'
import Product from '../models/Product.js'

const CLIP_ID_PATTERN = /^AKHD-\d{5,8}$/

export const isValidClipId = (value = '') => CLIP_ID_PATTERN.test(value.trim().toUpperCase())

export const generateClipId = async () => {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const id = `AKHD-${Math.floor(10000 + Math.random() * 90000)}`
    const exists = await Product.exists({ clipId: id })
    if (!exists) return id
  }

  return `AKHD-${Date.now().toString().slice(-8)}`
}

export const generateLicenseNumber = () => {
  const year = new Date().getFullYear()
  const suffix = Math.floor(100000 + Math.random() * 900000)
  return `LIC-${year}-${suffix}`
}

export const resolveClipId = async (requestedClipId = '', existingClipId = '') => {
  const normalized = requestedClipId?.trim().toUpperCase() || ''

  if (normalized) {
    if (!isValidClipId(normalized)) {
      throw new AppError('Clip ID must look like AKHD-12345', 400)
    }
    return normalized
  }

  if (existingClipId) {
    return existingClipId
  }

  return generateClipId()
}

export const assertClipIdAvailable = async (clipId, excludeProductId = '') => {
  const filter = { clipId }
  if (excludeProductId) {
    filter._id = { $ne: excludeProductId }
  }

  const exists = await Product.exists(filter)
  if (exists) {
    throw new AppError('This Clip ID is already in use', 400)
  }
}
