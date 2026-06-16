import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'

const TOKEN_EXPIRY = '7d'
const COOKIE_NAME = 'fv_admin_token'

export const getAdminCookieName = () => COOKIE_NAME

export const getAdminCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
})

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new AppError('Server auth is not configured', 500)
  }
  return secret
}

export const signAdminToken = (user) =>
  jwt.sign(
    {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: TOKEN_EXPIRY },
  )

export const verifyAdminToken = (token) => {
  try {
    const payload = jwt.verify(token, getJwtSecret())
    if (payload.role !== 'admin') {
      throw new AppError('Admin access required', 403)
    }
    return payload
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    throw new AppError('Invalid or expired session', 401)
  }
}

export const authenticateAdmin = async (email, password) => {
  const normalizedEmail = email?.trim().toLowerCase()

  if (!normalizedEmail || !password) {
    throw new AppError('Email and password are required', 400)
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password')

  if (!user || user.role !== 'admin') {
    throw new AppError('Invalid email or password', 401)
  }

  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    throw new AppError('Invalid email or password', 401)
  }

  return user
}

export const formatAdminResponse = (user) => ({
  id: user._id.toString(),
  email: user.email,
  name: user.name,
  role: user.role,
})

export const getAdminById = async (adminId) => {
  const user = await User.findById(adminId)

  if (!user || user.role !== 'admin') {
    throw new AppError('Admin account not found', 401)
  }

  return user
}
