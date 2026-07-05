import { Router } from 'express'
import { listMySupportRequests, submitSupportRequest } from '../controllers/supportController.js'
import cartSession from '../middleware/cartSession.js'
import { optionalUser } from '../middleware/optionalUser.js'

const router = Router()

router.use(cartSession)
router.use(optionalUser)

router.get('/mine', listMySupportRequests)
router.post('/', submitSupportRequest)

export default router
