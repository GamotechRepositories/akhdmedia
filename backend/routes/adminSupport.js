import { Router } from 'express'
import {
  getSupportRequest,
  listSupportRequests,
  patchSupportRequest,
} from '../controllers/supportController.js'

const router = Router()

router.get('/', listSupportRequests)
router.get('/:id', getSupportRequest)
router.patch('/:id', patchSupportRequest)

export default router
