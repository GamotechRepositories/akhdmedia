import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { GOOGLE_CLIENT_ID } from '../config/google.js'
import {
  PASSWORD_RESET_EXPIRY_MS,
  REGISTRATION_OTP_EXPIRY_MINUTES,
  REGISTRATION_OTP_EXPIRY_MS,
  REGISTRATION_OTP_RESEND_COOLDOWN_MS,
  isEmailConfigured,
} from '../config/email.js'
import { sendPasswordResetEmail, sendRegistrationOtpEmail } from './emailService.js'
import Admin from '../models/Admin.js'
import PendingRegistration from '../models/PendingRegistration.js'
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

  const [existingUser, existingAdmin] = await Promise.all([
    User.findOne({ email: fields.email }),
    Admin.findOne({ email: fields.email }),
  ])
  if (existingUser || existingAdmin) {
    throw new AppError('An account with this email already exists', 409)
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

  return User.create({
    ...fields,
    password: hashedPassword,
  })
}

const hashOtp = (code) => crypto.createHash('sha256').update(String(code)).digest('hex')

const createRegistrationOtp = () => String(Math.floor(100000 + Math.random() * 900000))

const assertEmailAvailable = async (email) => {
  const [existingUser, existingAdmin] = await Promise.all([
    User.findOne({ email }),
    Admin.findOne({ email }),
  ])
  if (existingUser || existingAdmin) {
    throw new AppError('An account with this email already exists', 409)
  }
}

const sendOtpForPending = async (pending, { name, force = false } = {}) => {
  if (!isEmailConfigured()) {
    throw new AppError(
      'Email verification is not configured. Please contact support or try again later.',
      503,
    )
  }

  const now = Date.now()
  if (
    !force &&
    pending.lastOtpSentAt &&
    now - new Date(pending.lastOtpSentAt).getTime() < REGISTRATION_OTP_RESEND_COOLDOWN_MS
  ) {
    const waitSeconds = Math.ceil(
      (REGISTRATION_OTP_RESEND_COOLDOWN_MS -
        (now - new Date(pending.lastOtpSentAt).getTime())) /
        1000,
    )
    throw new AppError(`Please wait ${waitSeconds}s before requesting another code`, 429)
  }

  const code = createRegistrationOtp()
  pending.otpHash = hashOtp(code)
  pending.otpExpires = new Date(now + REGISTRATION_OTP_EXPIRY_MS)
  pending.lastOtpSentAt = new Date(now)
  await pending.save()

  const emailResult = await sendRegistrationOtpEmail({
    email: pending.email,
    name: name || pending.name,
    code,
    expiryMinutes: REGISTRATION_OTP_EXPIRY_MINUTES,
  })

  if (!emailResult?.sent) {
    throw new AppError('Could not send verification code. Please try again later.', 503)
  }

  return {
    email: pending.email,
    expiresInMinutes: REGISTRATION_OTP_EXPIRY_MINUTES,
  }
}

/** Validate signup details and email a 6-digit OTP. Account is created only after verify. */
export const sendRegistrationOtp = async ({ name, email, phone, password }) => {
  const fields = validateUserFields({ name, email, phone })
  validatePassword(password)
  await assertEmailAvailable(fields.email)

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  let pending = await PendingRegistration.findOne({ email: fields.email }).select(
    '+passwordHash +otpHash',
  )

  if (pending) {
    pending.name = fields.name
    pending.phone = fields.phone
    pending.passwordHash = passwordHash
  } else {
    pending = new PendingRegistration({
      ...fields,
      passwordHash,
      otpHash: 'pending',
      otpExpires: new Date(Date.now() + REGISTRATION_OTP_EXPIRY_MS),
    })
  }

  return sendOtpForPending(pending, { name: fields.name, force: true })
}

export const resendRegistrationOtp = async (email) => {
  const trimmedEmail = email?.trim().toLowerCase()
  if (!trimmedEmail) {
    throw new AppError('Email is required', 400)
  }

  await assertEmailAvailable(trimmedEmail)

  const pending = await PendingRegistration.findOne({ email: trimmedEmail }).select(
    '+passwordHash +otpHash',
  )

  if (!pending) {
    throw new AppError('No pending signup found for this email. Please start again.', 404)
  }

  return sendOtpForPending(pending, { name: pending.name })
}

export const verifyRegistrationOtp = async ({ email, code }) => {
  const trimmedEmail = email?.trim().toLowerCase()
  const trimmedCode = String(code || '').trim()

  if (!trimmedEmail) {
    throw new AppError('Email is required', 400)
  }

  if (!/^\d{6}$/.test(trimmedCode)) {
    throw new AppError('Please enter the 6-digit verification code', 400)
  }

  await assertEmailAvailable(trimmedEmail)

  const pending = await PendingRegistration.findOne({ email: trimmedEmail }).select(
    '+passwordHash +otpHash',
  )

  if (!pending) {
    throw new AppError('No pending signup found for this email. Please start again.', 404)
  }

  if (!pending.otpExpires || pending.otpExpires.getTime() < Date.now()) {
    throw new AppError('This verification code has expired. Please request a new one.', 400)
  }

  if (pending.otpHash !== hashOtp(trimmedCode)) {
    throw new AppError('Invalid verification code', 400)
  }

  const user = await User.create({
    name: pending.name,
    email: pending.email,
    phone: pending.phone,
    password: pending.passwordHash,
  })

  await PendingRegistration.deleteOne({ _id: pending._id })

  return user
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

const getGoogleClientId = () => GOOGLE_CLIENT_ID

const getAllowedGoogleAudiences = () => {
  const audiences = new Set()
  const webClientId = getGoogleClientId()
  if (webClientId) audiences.add(webClientId)

  for (const envKey of ['GOOGLE_ANDROID_CLIENT_ID', 'GOOGLE_IOS_CLIENT_ID']) {
    const value = process.env[envKey]?.trim()
    if (value) audiences.add(value)
  }

  return [...audiences]
}

const verifyGoogleCredential = async (credential) => {
  const webClientId = getGoogleClientId()
  if (!webClientId) {
    throw new AppError('Google sign-in is not configured on the server', 503)
  }

  const audiences = getAllowedGoogleAudiences()
  const client = new OAuth2Client(webClientId)

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential.trim(),
      audience: audiences,
    })
    return ticket.getPayload()
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[auth] Google ID token verification failed:', error?.message)
    }
    throw new AppError('Google sign-in failed. Please try again.', 401)
  }
}

export const getGoogleAuthStatus = () => {
  const webClientId = getGoogleClientId()
  return {
    serverConfigured: Boolean(webClientId),
    hasAndroidClientId: Boolean(process.env.GOOGLE_ANDROID_CLIENT_ID?.trim()),
    hasIosClientId: Boolean(process.env.GOOGLE_IOS_CLIENT_ID?.trim()),
  }
}

export const authenticateWithGoogle = async (credential) => {
  if (!getGoogleClientId()) {
    throw new AppError('Google sign-in is not configured on the server', 503)
  }

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
      const existingAdmin = await Admin.findOne({ email })
      if (existingAdmin) {
        throw new AppError('This email is registered as an admin account', 409)
      }

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
