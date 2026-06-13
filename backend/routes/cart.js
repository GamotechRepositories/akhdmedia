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

const router = Router()

router.use(cartSession)

router.get('/', getCart)
router.post('/items', addToCart)
router.post('/buy-now', buyNow)
router.patch('/items/:itemId', updateCartItem)
router.delete('/items/:itemId', deleteCartItem)
router.delete('/', clearCart)

export default router
