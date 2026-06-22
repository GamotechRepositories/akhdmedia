import PromoCode from '../models/PromoCode.js'
import Order from '../models/Order.js'
import AppError from '../utils/AppError.js'
import { roundMoney } from '../utils/money.js'
export const normalizePromoCode = (value = '') => value.trim().toUpperCase()

export const formatPromoCode = (promo) => ({
  id: promo._id.toString(),
  code: promo.code,
  description: promo.description || '',
  discountType: promo.discountType,
  discountValue: promo.discountValue,
  minOrderAmount: promo.minOrderAmount ?? 0,
  maxUses: promo.maxUses ?? null,
  maxUsesPerUser: promo.maxUsesPerUser ?? null,
  usedCount: promo.usedCount ?? 0,  expiresAt: promo.expiresAt || null,
  isActive: promo.isActive,
  createdAt: promo.createdAt,
  updatedAt: promo.updatedAt,
})

const getPromoValidationError = (promo, taxableSubtotal = 0, userUsageCount = 0) => {
  if (!promo) {
    return 'Invalid promo code'
  }

  if (!promo.isActive) {
    return 'This promo code is no longer active'
  }

  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
    return 'This promo code has expired'
  }

  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) {
    return 'This promo code has reached its usage limit'
  }

  if (promo.maxUsesPerUser != null && userUsageCount >= promo.maxUsesPerUser) {
    return 'You have already used this promo code the maximum number of times'
  }

  if (taxableSubtotal < (promo.minOrderAmount || 0)) {
    return `Minimum order amount of ₹${promo.minOrderAmount} required for this promo code`
  }

  return ''
}

export const calculatePromoDiscount = (promo, taxableSubtotal) => {
  const normalizedSubtotal = roundMoney(taxableSubtotal)

  if (!promo || normalizedSubtotal <= 0) {
    return 0
  }

  if (promo.discountType === 'percentage') {
    return roundMoney(Math.min(normalizedSubtotal, (normalizedSubtotal * promo.discountValue) / 100))
  }

  return roundMoney(Math.min(normalizedSubtotal, promo.discountValue))
}

export const findPromoByCode = async (code) => {
  const normalizedCode = normalizePromoCode(code)
  if (!normalizedCode) {
    return null
  }

  return PromoCode.findOne({ code: normalizedCode })
}

export const getUserPromoUsageCount = async (userId, code) => {
  if (!userId) {
    return 0
  }

  const normalizedCode = normalizePromoCode(code)
  if (!normalizedCode) {
    return 0
  }

  return Order.countDocuments({
    userId,
    promoCode: normalizedCode,
    paymentStatus: 'paid',
  })
}

export const validatePromoForOrder = async (code, taxableSubtotal, userId = null) => {
  const promo = await findPromoByCode(code)
  let userUsageCount = 0

  if (userId && promo?.maxUsesPerUser != null) {
    userUsageCount = await getUserPromoUsageCount(userId, promo.code)
  }

  const message = getPromoValidationError(promo, taxableSubtotal, userUsageCount)

  if (message) {
    throw new AppError(message, 400)
  }

  const discountAmount = calculatePromoDiscount(promo, taxableSubtotal)

  if (discountAmount <= 0) {
    throw new AppError('This promo code does not apply to your order', 400)
  }

  return { promo, discountAmount }
}

export const incrementPromoUsage = async (code) => {
  const normalizedCode = normalizePromoCode(code)
  if (!normalizedCode) return null

  return PromoCode.findOneAndUpdate(
    { code: normalizedCode },
    { $inc: { usedCount: 1 } },
    { new: true },
  )
}

export const getAllPromoCodes = async () =>
  PromoCode.find().sort({ createdAt: -1 })

export const getPromoCodeById = async (id) => PromoCode.findById(id)

export const createPromoCode = async (payload) => {
  const code = normalizePromoCode(payload.code)
  if (!code) {
    throw new AppError('Promo code is required', 400)
  }

  const existing = await PromoCode.findOne({ code })
  if (existing) {
    throw new AppError('A promo code with this value already exists', 400)
  }

  if (payload.discountType === 'percentage' && payload.discountValue > 100) {
    throw new AppError('Percentage discount cannot exceed 100', 400)
  }

  return PromoCode.create({
    ...payload,
    code,
    maxUses: payload.maxUses === '' || payload.maxUses == null ? null : Number(payload.maxUses),
    maxUsesPerUser:
      payload.maxUsesPerUser === '' || payload.maxUsesPerUser == null
        ? null
        : Number(payload.maxUsesPerUser),
    minOrderAmount: Number(payload.minOrderAmount) || 0,
    expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
  })
}

export const updatePromoCode = async (id, payload) => {
  const updates = { ...payload }

  if (updates.code != null) {
    updates.code = normalizePromoCode(updates.code)
    if (!updates.code) {
      throw new AppError('Promo code is required', 400)
    }

    const duplicate = await PromoCode.findOne({
      code: updates.code,
      _id: { $ne: id },
    })

    if (duplicate) {
      throw new AppError('A promo code with this value already exists', 400)
    }
  }

  if (updates.discountType === 'percentage' && updates.discountValue > 100) {
    throw new AppError('Percentage discount cannot exceed 100', 400)
  }

  if ('maxUses' in updates) {
    updates.maxUses =
      updates.maxUses === '' || updates.maxUses == null ? null : Number(updates.maxUses)
  }

  if ('maxUsesPerUser' in updates) {
    updates.maxUsesPerUser =
      updates.maxUsesPerUser === '' || updates.maxUsesPerUser == null
        ? null
        : Number(updates.maxUsesPerUser)
  }

  if ('minOrderAmount' in updates) {
    updates.minOrderAmount = Number(updates.minOrderAmount) || 0
  }

  if ('expiresAt' in updates) {
    updates.expiresAt = updates.expiresAt ? new Date(updates.expiresAt) : null
  }

  const promo = await PromoCode.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })

  if (!promo) {
    throw new AppError('Promo code not found', 404)
  }

  return promo
}

export const deletePromoCode = async (id) => {
  const promo = await PromoCode.findById(id)
  if (!promo) {
    throw new AppError('Promo code not found', 404)
  }

  await promo.deleteOne()
  return promo
}
