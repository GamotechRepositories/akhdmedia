import { Router } from 'express'
import {
  createOrder,
  getOrder,
  getOrderDownloads,
  getProfile,
  updateProfile,
} from '../controllers/orderController.js'
import cartSession from '../middleware/cartSession.js'

const router = Router()

router.use(cartSession)

router.get('/profile', getProfile)
router.put('/profile', updateProfile)
router.post('/', createOrder)
router.get('/:id/downloads', getOrderDownloads)
router.get('/:id', getOrder)

export default router
