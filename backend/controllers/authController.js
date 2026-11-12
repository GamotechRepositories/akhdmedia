import asyncHandler from '../utils/asyncHandler.js'
import {
  formatAdminResponse,
  getAdminById,
  getAdminCookieName,
  getAdminCookieOptions,
  requestAdminLoginOtp,
  signAdminToken,
  verifyAdminLoginOtp,
} from '../services/authService.js'

export const sendLoginOtp = asyncHandler(async (req, res) => {
  const result = await requestAdminLoginOtp(req.body?.email)

  res.json({
    success: true,
    message: 'A login code was sent to the admin email.',
    data: result,
  })
})

export const verifyLoginOtp = asyncHandler(async (req, res) => {
  const admin = await verifyAdminLoginOtp(req.body?.email, req.body?.code)
  const token = signAdminToken(admin)

  res.cookie(getAdminCookieName(), token, getAdminCookieOptions())

  res.json({
    success: true,
    message: 'Logged in successfully',
    data: {
      admin: formatAdminResponse(admin),
    },
  })
})

export const rejectPasswordLogin = asyncHandler(async (req, res) => {
  res.status(400).json({
    message: 'Password sign-in is turned off. Request a one-time code for the admin email.',
  })
})

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(getAdminCookieName(), getAdminCookieOptions())

  res.json({
    success: true,
    message: 'Logged out successfully',
  })
})

export const getMe = asyncHandler(async (req, res) => {
  const admin = await getAdminById(req.admin.id)

  res.json({
    success: true,
    data: {
      admin: formatAdminResponse(admin),
    },
  })
})
