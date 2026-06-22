import { Router } from 'express'
import {
  addToCart,
  applyPromoCode,
  buyNow,
  clearCart,
  deleteCartItem,
  deletePromoCode,
  getCart,
  updateCartItem,
} from '../controllers/cartController.js'
import cartSession from '../middleware/cartSession.js'
import { requireUser } from '../middleware/requireUser.js'

const router = Router()

router.use(cartSession)

router.get('/', getCart)
router.post('/items', requireUser, addToCart)
router.post('/buy-now', requireUser, buyNow)
router.patch('/items/:itemId', requireUser, updateCartItem)
router.delete('/items/:itemId', requireUser, deleteCartItem)
router.post('/promo', requireUser, applyPromoCode)
router.delete('/promo', requireUser, deletePromoCode)
router.delete('/', requireUser, clearCart)

export default router
