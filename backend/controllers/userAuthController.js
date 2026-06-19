import asyncHandler from '../utils/asyncHandler.js'
import {
  authenticateUser,
  authenticateWithGoogle,
  formatUserResponse,
  getUserById,
  getUserCookieName,
  getUserCookieOptions,
  registerUser,
  signUserToken,
  updateUserProfile,
} from '../services/userAuthService.js'

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

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body)
  sendAuthResponse(res, user, 'Account created successfully')
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

export const logout = asyncHandler(async (req, res) => {
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
