import { Router } from 'express'
import {
  addToCart,
  buyNow,
  clearCart,
  deleteCartItem,
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
router.delete('/', requireUser, clearCart)

export default router
