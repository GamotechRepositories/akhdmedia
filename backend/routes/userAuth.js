import { Router } from 'express'
import { getMe, login, logout, register, updateProfile } from '../controllers/userAuthController.js'
import { requireUser } from '../middleware/requireUser.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)
router.get('/me', requireUser, getMe)
router.patch('/profile', requireUser, updateProfile)

export default router
