import { getUserCookieName, verifyUserToken } from '../services/userAuthService.js'

export const optionalUser = (req, res, next) => {
  const cookieName = getUserCookieName()
  const token =
    req.cookies?.[cookieName] ||
    req.headers.authorization?.replace(/^Bearer\s+/i, '').trim()

  if (!token) {
    return next()
  }

  try {
    req.user = verifyUserToken(token)
  } catch {
    req.user = null
  }

  return next()
}
