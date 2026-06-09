import asyncHandler from '../utils/asyncHandler.js'
import {
  authenticateAdmin,
  formatAdminResponse,
  getAdminById,
  getAdminCookieName,
  getAdminCookieOptions,
  signAdminToken,
} from '../services/authService.js'

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  const admin = await authenticateAdmin(email, password)
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
