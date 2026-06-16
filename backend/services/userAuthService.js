import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'

const SALT_ROUNDS = 10
const TOKEN_EXPIRY = '30d'
const COOKIE_NAME = 'fv_user_token'

export const getUserCookieName = () => COOKIE_NAME

export const getUserCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000,
})

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new AppError('Server auth is not configured', 500)
  }
  return secret
}

export const normalizePhone = (phone = '') => phone.replace(/\D/g, '')

export const signUserToken = (user) =>
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

export const verifyUserToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret())
  } catch {
    throw new AppError('Invalid or expired session', 401)
  }
}

export const formatUserResponse = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
})

export const getUserById = async (userId) => {
  const user = await User.findById(userId)

  if (!user) {
    throw new AppError('Account not found', 401)
  }

  return user
}

const validatePassword = (password) => {
  if (!password || password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400)
  }
}

const validateUserFields = ({ name, email, phone }) => {
  const trimmedName = name?.trim()
  const trimmedEmail = email?.trim().toLowerCase()
  const trimmedPhone = phone?.trim()

  if (!trimmedName) {
    throw new AppError('Name is required', 400)
  }

  if (!trimmedEmail) {
    throw new AppError('Email is required', 400)
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new AppError('Please enter a valid email address', 400)
  }

  if (!trimmedPhone) {
    throw new AppError('Phone number is required', 400)
  }

  const digits = normalizePhone(trimmedPhone)
  if (digits.length < 10) {
    throw new AppError('Please enter a valid phone number', 400)
  }

  return {
    name: trimmedName,
    email: trimmedEmail,
    phone: trimmedPhone,
  }
}

export const registerUser = async ({ name, email, phone, password }) => {
  const fields = validateUserFields({ name, email, phone })
  validatePassword(password)

  const existing = await User.findOne({ email: fields.email })
  if (existing) {
    throw new AppError('An account with this email already exists', 409)
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

  return User.create({
    ...fields,
    password: hashedPassword,
  })
}

export const authenticateUser = async (email, password) => {
  const trimmedEmail = email?.trim().toLowerCase()

  if (!trimmedEmail || !password) {
    throw new AppError('Email and password are required', 400)
  }

  const user = await User.findOne({ email: trimmedEmail }).select('+password')

  if (!user) {
    throw new AppError('Invalid email or password', 401)
  }

  const isMatch = await bcrypt.compare(password, user.password)

  if (!isMatch) {
    throw new AppError('Invalid email or password', 401)
  }

  return user
}

const validateProfileFields = ({ name, phone }) => {
  const trimmedName = name?.trim()
  const trimmedPhone = phone?.trim()

  if (!trimmedName) {
    throw new AppError('Name is required', 400)
  }

  if (!trimmedPhone) {
    throw new AppError('Phone number is required', 400)
  }

  const digits = normalizePhone(trimmedPhone)
  if (digits.length < 10) {
    throw new AppError('Please enter a valid phone number', 400)
  }

  return {
    name: trimmedName,
    phone: trimmedPhone,
  }
}

export const updateUserProfile = async (userId, { name, phone }) => {
  const fields = validateProfileFields({ name, phone })
  const user = await User.findByIdAndUpdate(userId, fields, {
    new: true,
    runValidators: true,
  })

  if (!user) {
    throw new AppError('Account not found', 404)
  }

  return user
}
