import AppError from '../utils/AppError.js'
import { getAdminCookieName, verifyAdminToken } from '../services/authService.js'

export const requireAdmin = (req, res, next) => {
  const cookieName = getAdminCookieName()
  const token =
    req.cookies?.[cookieName] ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    return next(new AppError('Authentication required', 401))
  }

  try {
    req.admin = verifyAdminToken(token)
    return next()
  } catch (error) {
    return next(error)
  }
}

export const requireAdminForQuery = (req, res, next) => {
  if (req.query.admin === 'true') {
    return requireAdmin(req, res, next)
  }
  return next()
}
