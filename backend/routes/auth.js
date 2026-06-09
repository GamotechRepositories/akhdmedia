import { Router } from 'express'
import { getMe, login, logout } from '../controllers/authController.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = Router()

router.post('/login', login)
router.post('/logout', logout)
router.get('/me', requireAdmin, getMe)

export default router
