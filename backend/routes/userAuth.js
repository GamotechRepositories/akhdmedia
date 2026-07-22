import { Router } from 'express'
import {
  confirmDeleteAccount,
  forgotPassword,
  getAuthConfig,
  getMe,
  googleAuth,
  googleAuthStatus,
  login,
  logout,
  register,
  requestDeleteAccount,
  resendForgotPasswordOtp,
  resendRegisterOtp,
  resetPassword,
  sendRegisterOtp,
  updateProfile,
  verifyRegisterOtp,
} from '../controllers/userAuthController.js'
import { requireUser } from '../middleware/requireUser.js'

const router = Router()

router.get('/config', getAuthConfig)
router.post('/register', register)
router.post('/register/send-otp', sendRegisterOtp)
router.post('/register/resend-otp', resendRegisterOtp)
router.post('/register/verify-otp', verifyRegisterOtp)
router.post('/login', login)
router.post('/google', googleAuth)
router.get('/google/status', googleAuthStatus)
router.post('/forgot-password', forgotPassword)
router.post('/forgot-password/resend-otp', resendForgotPasswordOtp)
router.post('/reset-password', resetPassword)
router.post('/logout', logout)
router.get('/me', requireUser, getMe)
router.patch('/profile', requireUser, updateProfile)
router.post('/delete-account/request', requireUser, requestDeleteAccount)
router.post('/delete-account/confirm', requireUser, confirmDeleteAccount)

export default router
