import { Router } from 'express'
import { getAdminOrder, listAdminOrders } from '../controllers/orderController.js'

const router = Router()

router.get('/', listAdminOrders)
router.get('/:id', getAdminOrder)

export default router
