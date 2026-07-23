import { randomUUID } from 'crypto'

export const CART_SESSION_COOKIE = 'fv_session'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const cartSession = (req, res, next) => {
  let sessionId = req.cookies?.[CART_SESSION_COOKIE]

  if (!sessionId) {
    sessionId = randomUUID()
    res.cookie(CART_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: THIRTY_DAYS_MS,
      secure: process.env.NODE_ENV === 'production',
    })
  }

  req.sessionId = sessionId
  next()
}

export default cartSession
