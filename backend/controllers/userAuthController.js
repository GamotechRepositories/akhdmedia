import asyncHandler from '../utils/asyncHandler.js'
import { GOOGLE_CLIENT_ID } from '../config/google.js'
import {
  confirmAccountDeletion,
  requestAccountDeletion,
} from '../services/accountDeletionService.js'
import {
  authenticateUser,
  authenticateWithGoogle,
  formatUserResponse,
  getGoogleAuthStatus,
  getUserById,
  getUserCookieName,
  getUserCookieOptions,
  registerUser,
  requestPasswordReset,
  resendPasswordResetOtp,
  resendRegistrationOtp,
  resetPasswordWithOtp,
  sendRegistrationOtp,
  signUserToken,
  updateUserProfile,
  verifyRegistrationOtp,
} from '../services/userAuthService.js'
import { clearCartItems } from '../services/cartService.js'
import { CART_SESSION_COOKIE } from '../middleware/cartSession.js'

const sendAuthResponse = (res, user, message) => {
  const token = signUserToken(user)
  res.cookie(getUserCookieName(), token, getUserCookieOptions())

  res.json({
    success: true,
    message,
    data: {
      user: formatUserResponse(user),
    },
  })
}

export const getAuthConfig = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      googleClientId: GOOGLE_CLIENT_ID,
      googleIosClientId: process.env.GOOGLE_IOS_CLIENT_ID?.trim() || '',
    },
  })
})

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body)
  sendAuthResponse(res, user, 'Account created successfully')
})

export const sendRegisterOtp = asyncHandler(async (req, res) => {
  const result = await sendRegistrationOtp(req.body)

  res.json({
    success: true,
    message: `A verification code has been sent to ${result.email}`,
    data: result,
  })
})

export const resendRegisterOtp = asyncHandler(async (req, res) => {
  const result = await resendRegistrationOtp(req.body.email)

  res.json({
    success: true,
    message: `A new verification code has been sent to ${result.email}`,
    data: result,
  })
})

export const verifyRegisterOtp = asyncHandler(async (req, res) => {
  const user = await verifyRegistrationOtp(req.body)
  sendAuthResponse(res, user, 'Email verified. Account created successfully')
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const user = await authenticateUser(email, password)
  sendAuthResponse(res, user, 'Logged in successfully')
})

export const googleAuth = asyncHandler(async (req, res) => {
  const user = await authenticateWithGoogle(req.body.credential)
  sendAuthResponse(res, user, 'Logged in with Google successfully')
})

export const googleAuthStatus = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: getGoogleAuthStatus(),
  })
})

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await requestPasswordReset(req.body.email)

  res.json({
    success: true,
    message: `A verification code has been sent to ${result.email}`,
    data: result,
  })
})

export const resendForgotPasswordOtp = asyncHandler(async (req, res) => {
  const result = await resendPasswordResetOtp(req.body.email)

  res.json({
    success: true,
    message: `A new verification code has been sent to ${result.email}`,
    data: result,
  })
})

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await resetPasswordWithOtp(req.body)
  sendAuthResponse(res, user, 'Password updated successfully')
})

export const logout = asyncHandler(async (req, res) => {
  const sessionId = req.cookies?.[CART_SESSION_COOKIE]
  if (sessionId) {
    try {
      await clearCartItems(sessionId)
    } catch (error) {
      console.warn('[auth] Failed to clear cart on logout:', error?.message || error)
    }
  }

  res.clearCookie(getUserCookieName(), getUserCookieOptions())

  res.json({
    success: true,
    message: 'Logged out successfully',
  })
})

export const getMe = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id)

  res.json({
    success: true,
    data: {
      user: formatUserResponse(user),
    },
  })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await updateUserProfile(req.user.id, req.body)

  const token = signUserToken(user)
  res.cookie(getUserCookieName(), token, getUserCookieOptions())

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: formatUserResponse(user),
    },
  })
})

export const requestDeleteAccount = asyncHandler(async (req, res) => {
  const result = await requestAccountDeletion(req.user.id, req.body.reason)

  res.json({
    success: true,
    message: `A confirmation code has been sent to ${result.email}`,
    data: result,
  })
})

export const confirmDeleteAccount = asyncHandler(async (req, res) => {
  await confirmAccountDeletion(req.user.id, req.body.code)
  res.clearCookie(getUserCookieName(), getUserCookieOptions())

  res.json({
    success: true,
    message: 'Your account has been deleted successfully',
  })
})
