import { Router } from 'express'
import { forgotPassword, getMe, googleAuth, login, logout, register, resetPassword, updateProfile } from '../controllers/userAuthController.js'
import { requireUser } from '../middleware/requireUser.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/google', googleAuth)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/logout', logout)
router.get('/me', requireUser, getMe)
router.patch('/profile', requireUser, updateProfile)

export default router
