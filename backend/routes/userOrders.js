import { Router } from 'express'
import { getUserOrder, listUserOrders } from '../controllers/userOrderController.js'
import { requireUser } from '../middleware/requireUser.js'

const router = Router()

router.use(requireUser)

router.get('/', listUserOrders)
router.get('/:id', getUserOrder)

export default router
