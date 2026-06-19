import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { PASSWORD_RESET_EXPIRY_MS } from '../config/email.js'
import { sendPasswordResetEmail } from './emailService.js'
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
  hasGoogleAuth: Boolean(user.googleId),
  needsPhone: normalizePhone(user.phone).length < 10,
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

  if (!user.password) {
    throw new AppError('This account uses Google sign-in. Please continue with Google.', 401)
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

const getGoogleClientId = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim()
  if (!clientId) {
    throw new AppError('Google sign-in is not configured', 500)
  }
  return clientId
}

const verifyGoogleCredential = async (credential) => {
  const client = new OAuth2Client(getGoogleClientId())

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: getGoogleClientId(),
    })
    return ticket.getPayload()
  } catch {
    throw new AppError('Google sign-in failed. Please try again.', 401)
  }
}

export const authenticateWithGoogle = async (credential) => {
  if (!credential?.trim()) {
    throw new AppError('Google credential is required', 400)
  }

  const payload = await verifyGoogleCredential(credential.trim())
  const googleId = payload?.sub
  const email = payload?.email?.trim().toLowerCase()
  const name =
    payload?.name?.trim() ||
    payload?.given_name?.trim() ||
    email?.split('@')[0] ||
    'User'

  if (!googleId) {
    throw new AppError('Google sign-in failed. Please try again.', 401)
  }

  if (!email) {
    throw new AppError('Your Google account does not include an email address', 400)
  }

  if (payload.email_verified === false) {
    throw new AppError('Your Google email address is not verified', 400)
  }

  let user = await User.findOne({ googleId })

  if (!user) {
    user = await User.findOne({ email })

    if (user) {
      if (user.googleId && user.googleId !== googleId) {
        throw new AppError('This email is linked to another Google account', 409)
      }

      user.googleId = googleId
      if (!user.name?.trim()) {
        user.name = name
      }
      await user.save()
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        phone: '',
      })
    }
  }

  return user
}

const hashResetToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex')

const createPasswordResetToken = () => crypto.randomBytes(32).toString('hex')

const isValidEmail = (email = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

export const requestPasswordReset = async (email) => {
  const trimmedEmail = email?.trim().toLowerCase()

  if (!trimmedEmail) {
    throw new AppError('Email is required', 400)
  }

  if (!isValidEmail(trimmedEmail)) {
    throw new AppError('Please enter a valid email address', 400)
  }

  const user = await User.findOne({ email: trimmedEmail }).select('+password +passwordResetToken')

  if (!user?.password) {
    return { sent: false }
  }

  const resetToken = createPasswordResetToken()
  user.passwordResetToken = hashResetToken(resetToken)
  user.passwordResetExpires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS)
  await user.save()

  await sendPasswordResetEmail({
    email: user.email,
    name: user.name,
    resetToken,
  })

  return { sent: true }
}

export const resetPasswordWithToken = async (token, password) => {
  if (!token?.trim()) {
    throw new AppError('Reset token is required', 400)
  }

  validatePassword(password)

  const hashedToken = hashResetToken(token.trim())
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +passwordResetToken')

  if (!user) {
    throw new AppError('This password reset link is invalid or has expired', 400)
  }

  user.password = await bcrypt.hash(password, SALT_ROUNDS)
  user.passwordResetToken = ''
  user.passwordResetExpires = undefined
  await user.save()

  return user
}
