import { Router } from 'express'
import { submitSupportRequest } from '../controllers/supportController.js'
import cartSession from '../middleware/cartSession.js'

const router = Router()

router.use(cartSession)
router.post('/', submitSupportRequest)

export default router
