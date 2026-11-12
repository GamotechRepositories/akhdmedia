import { Router } from 'express'
import { getMe, logout, rejectPasswordLogin, sendLoginOtp, verifyLoginOtp } from '../controllers/authController.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = Router()

router.post('/login', rejectPasswordLogin)
router.post('/login/send-otp', sendLoginOtp)
router.post('/login/verify-otp', verifyLoginOtp)
router.post('/logout', logout)
router.get('/me', requireAdmin, getMe)

export default router
