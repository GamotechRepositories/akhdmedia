import { Router } from 'express'
import {
  createPromoCodeHandler,
  deletePromoCodeHandler,
  getPromoCode,
  listPromoCodes,
  updatePromoCodeHandler,
} from '../controllers/promoCodeController.js'
import { requirePermission } from '../middleware/requirePermission.js'
import { ADMIN_PERMISSIONS } from '../constants/adminPermissions.js'

const router = Router()

router.get('/', listPromoCodes)
router.get('/:id', getPromoCode)
router.post('/', requirePermission(ADMIN_PERMISSIONS.PROMO_CODES_WRITE), createPromoCodeHandler)
router.put('/:id', requirePermission(ADMIN_PERMISSIONS.PROMO_CODES_WRITE), updatePromoCodeHandler)
router.delete('/:id', requirePermission(ADMIN_PERMISSIONS.PROMO_CODES_WRITE), deletePromoCodeHandler)

export default router
