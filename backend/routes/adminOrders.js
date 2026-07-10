import { Router } from 'express'
import {
  deleteAdminOrder,
  getAdminOrder,
  listAdminOrders,
} from '../controllers/orderController.js'

const router = Router()

router.get('/', listAdminOrders)
router.get('/:id', getAdminOrder)
router.delete('/:id', deleteAdminOrder)

export default router
