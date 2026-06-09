import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import AppError from '../utils/AppError.js'

const SALT_ROUNDS = 10
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

export const signAdminToken = (admin) =>
  jwt.sign(
    {
      id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
    },
    getJwtSecret(),
    { expiresIn: TOKEN_EXPIRY },
  )

export const verifyAdminToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret())
  } catch {
    throw new AppError('Invalid or expired session', 401)
  }
}

export const authenticateAdmin = async (email, password) => {
  const normalizedEmail = email?.trim().toLowerCase()

  if (!normalizedEmail || !password) {
    throw new AppError('Email and password are required', 400)
  }

  const admin = await Admin.findOne({ email: normalizedEmail }).select('+password')

  if (!admin) {
    throw new AppError('Invalid email or password', 401)
  }

  const isMatch = await bcrypt.compare(password, admin.password)

  if (!isMatch) {
    throw new AppError('Invalid email or password', 401)
  }

  return admin
}

export const formatAdminResponse = (admin) => ({
  id: admin._id.toString(),
  email: admin.email,
  name: admin.name,
})

export const getAdminById = async (adminId) => {
  const admin = await Admin.findById(adminId)

  if (!admin) {
    throw new AppError('Admin account not found', 401)
  }

  return admin
}

export const syncAdminFromEnv = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    const count = await Admin.countDocuments()
    if (count === 0) {
      console.warn('ADMIN_EMAIL and ADMIN_PASSWORD are missing — no admin account in database')
    }
    return
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

  await Admin.findOneAndUpdate(
    { email },
    {
      email,
      password: hashedPassword,
      name: 'AKHMEDIA',
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  )

  // Remove old default admin if credentials were changed in .env
  await Admin.deleteMany({
    email: { $ne: email },
  })

  console.log(`Admin account synced (bcrypt hashed password in DB): ${email}`)
}
