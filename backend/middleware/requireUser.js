import AppError from '../utils/AppError.js'
import { getUserCookieName, verifyUserToken } from '../services/userAuthService.js'

export const requireUser = (req, res, next) => {
  const cookieName = getUserCookieName()
  const token =
    req.cookies?.[cookieName] ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    return next(new AppError('Authentication required', 401))
  }

  try {
    req.user = verifyUserToken(token)
    return next()
  } catch (error) {
    return next(error)
  }
}
