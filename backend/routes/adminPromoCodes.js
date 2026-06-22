import { Router } from 'express'
import {
  createPromoCodeHandler,
  deletePromoCodeHandler,
  getPromoCode,
  listPromoCodes,
  updatePromoCodeHandler,
} from '../controllers/promoCodeController.js'

const router = Router()

router.get('/', listPromoCodes)
router.get('/:id', getPromoCode)
router.post('/', createPromoCodeHandler)
router.put('/:id', updatePromoCodeHandler)
router.delete('/:id', deletePromoCodeHandler)

export default router
