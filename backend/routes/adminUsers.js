import { Router } from 'express'
import {
  deleteUser,
  getDeletedAccounts,
  getSavedUserSelection,
  getUserEmailHistory,
  getUserEmailSettings,
  getUser,
  listUsers,
  saveUserSelection,
  sendUserEmail,
  updateUserPremium,
} from '../controllers/adminUserController.js'

const router = Router()

router.get('/', listUsers)
router.get('/deleted', getDeletedAccounts)
router.get('/email-settings', getUserEmailSettings)
router.post('/email', sendUserEmail)
router.get('/selection', getSavedUserSelection)
router.post('/selection', saveUserSelection)
router.get('/:id/email-history', getUserEmailHistory)
router.get('/:id', getUser)
router.patch('/:id/premium', updateUserPremium)
router.put('/:id/premium', updateUserPremium)
router.delete('/:id', deleteUser)

export default router
