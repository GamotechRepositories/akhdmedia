import { Router } from 'express'
import { forgotPassword, getAuthConfig, getMe, googleAuth, googleAuthStatus, login, logout, register, resetPassword, updateProfile } from '../controllers/userAuthController.js'
import { requireUser } from '../middleware/requireUser.js'

const router = Router()

router.get('/config', getAuthConfig)
router.post('/register', register)
router.post('/login', login)
router.post('/google', googleAuth)
router.get('/google/status', googleAuthStatus)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/logout', logout)
router.get('/me', requireUser, getMe)
router.patch('/profile', requireUser, updateProfile)

export default router
