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
  resetPassword,
  updateProfile,
} from '../controllers/userAuthController.js'
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
router.post('/delete-account/request', requireUser, requestDeleteAccount)
router.post('/delete-account/confirm', requireUser, confirmDeleteAccount)

export default router
