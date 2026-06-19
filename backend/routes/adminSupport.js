import { Router } from 'express'
import {
  getSupportRequest,
  listSupportRequests,
  patchSupportRequest,
  sendSupportReply,
} from '../controllers/supportController.js'

const router = Router()

router.get('/', listSupportRequests)
router.get('/:id', getSupportRequest)
router.patch('/:id', patchSupportRequest)
router.post('/:id/reply', sendSupportReply)

export default router
