import asyncHandler from '../utils/asyncHandler.js'
import {
  createPromoCode,
  deletePromoCode,
  formatPromoCode,
  getAllPromoCodes,
  getPromoCodeById,
  updatePromoCode,
} from '../services/promoCodeService.js'

export const listPromoCodes = asyncHandler(async (req, res) => {
  const promoCodes = await getAllPromoCodes()
  res.json({
    success: true,
    data: {
      promoCodes: promoCodes.map(formatPromoCode),
    },
  })
})

export const getPromoCode = asyncHandler(async (req, res) => {
  const promo = await getPromoCodeById(req.params.id)

  if (!promo) {
    res.status(404).json({ message: 'Promo code not found' })
    return
  }

  res.json({
    success: true,
    data: {
      promoCode: formatPromoCode(promo),
    },
  })
})

export const createPromoCodeHandler = asyncHandler(async (req, res) => {
  const promo = await createPromoCode(req.body)

  res.status(201).json({
    success: true,
    message: 'Promo code created',
    data: {
      promoCode: formatPromoCode(promo),
    },
  })
})

export const updatePromoCodeHandler = asyncHandler(async (req, res) => {
  const promo = await updatePromoCode(req.params.id, req.body)

  res.json({
    success: true,
    message: 'Promo code updated',
    data: {
      promoCode: formatPromoCode(promo),
    },
  })
})

export const deletePromoCodeHandler = asyncHandler(async (req, res) => {
  await deletePromoCode(req.params.id)

  res.json({
    success: true,
    message: 'Promo code deleted',
  })
})
