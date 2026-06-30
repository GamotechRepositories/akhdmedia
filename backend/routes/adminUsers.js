import { Router } from 'express'
import {
  deleteUser,
  getSavedUserSelection,
  getUserEmailHistory,
  getUser,
  listUsers,
  saveUserSelection,
  sendUserEmail,
} from '../controllers/adminUserController.js'

const router = Router()

router.get('/', listUsers)
router.post('/email', sendUserEmail)
router.get('/selection', getSavedUserSelection)
router.post('/selection', saveUserSelection)
router.get('/:id/email-history', getUserEmailHistory)
router.get('/:id', getUser)
router.delete('/:id', deleteUser)

export default router
