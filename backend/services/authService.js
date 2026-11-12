import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'
import AppError from '../utils/AppError.js'
import {
  ADMIN_LOGIN_OTP_EXPIRY_MINUTES,
  ADMIN_LOGIN_OTP_EXPIRY_MS,
  ADMIN_LOGIN_OTP_MAX_ATTEMPTS,
  ADMIN_LOGIN_OTP_RESEND_COOLDOWN_MS,
  isEmailConfigured,
} from '../config/email.js'
import { sendAdminLoginOtpEmail } from './emailService.js'

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
      role: 'admin',
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

const OTP_SELECT = '+loginOtpHash +loginOtpExpiresAt +loginOtpSentAt +loginOtpAttempts'

const hashOtp = (code) => crypto.createHash('sha256').update(String(code)).digest('hex')

const createLoginOtp = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0')

export const getConfiguredAdminEmail = () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    throw new AppError('Admin login email is not configured', 500)
  }
  return email
}

const normalizeLoginEmail = (email) => {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized || !normalized.includes('@')) {
    throw new AppError('Enter your team email', 400)
  }
  return normalized
}

const findLoginAdmin = async (email) => {
  const normalized = normalizeLoginEmail(email)
  const existing = await Admin.findOne({ email: normalized })
  if (existing) return existing

  if (normalized === getConfiguredAdminEmail()) {
    return ensureLoginAdmin(normalized)
  }

  throw new AppError('This email is not on the admin team', 401)
}

const clearLoginOtp = (adminId) =>
  Admin.updateOne(
    { _id: adminId },
    {
      $set: {
        loginOtpHash: '',
        loginOtpExpiresAt: null,
        loginOtpAttempts: 0,
      },
    },
  )

const ensureLoginAdmin = async (email) => {
  const existing = await Admin.findOne({ email })
  if (existing) return existing

  const superAdmin = await Admin.findOne({ isSuperAdmin: true }).sort({ createdAt: 1 })
  if (superAdmin) {
    await Admin.updateOne({ _id: superAdmin._id }, { $set: { email } })
    superAdmin.email = email
    return superAdmin
  }

  const password = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10)
  return Admin.create({
    email,
    password,
    name: 'AKHD MEDIA & CO',
    phone: '',
    isSuperAdmin: true,
    permissions: [],
  })
}

export const requestAdminLoginOtp = async (email) => {
  if (!isEmailConfigured()) {
    throw new AppError('Email delivery is not configured. Try again later.', 503)
  }

  const admin = await findLoginAdmin(email)
  const inbox = getConfiguredAdminEmail()
  const record = await Admin.findById(admin._id).select(OTP_SELECT)
  if (!record) {
    throw new AppError('Admin account not found', 404)
  }

  const now = Date.now()
  if (record.loginOtpSentAt) {
    const elapsed = now - new Date(record.loginOtpSentAt).getTime()
    if (elapsed < ADMIN_LOGIN_OTP_RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((ADMIN_LOGIN_OTP_RESEND_COOLDOWN_MS - elapsed) / 1000)
      throw new AppError(`Please wait ${waitSeconds}s before requesting another code`, 429)
    }
  }

  const code = createLoginOtp()
  await Admin.updateOne(
    { _id: record._id },
    {
      $set: {
        loginOtpHash: hashOtp(code),
        loginOtpExpiresAt: new Date(now + ADMIN_LOGIN_OTP_EXPIRY_MS),
        loginOtpSentAt: new Date(now),
        loginOtpAttempts: 0,
      },
    },
  )

  try {
    const emailResult = await sendAdminLoginOtpEmail({
      email: inbox,
      name: record.name,
      accountEmail: record.email,
      code,
      expiryMinutes: ADMIN_LOGIN_OTP_EXPIRY_MINUTES,
    })

    if (!emailResult?.sent) {
      throw new Error('Resend did not send the admin login code')
    }
  } catch (error) {
    await clearLoginOtp(record._id)
    await Admin.updateOne({ _id: record._id }, { $set: { loginOtpSentAt: null } })
    console.error('[email] Admin login OTP failed:', error.message)
    throw new AppError('Could not send the login code. Try again in a moment.', 503)
  }

  return {
    email: record.email,
    name: record.name,
    sentTo: inbox,
    expiresInMinutes: ADMIN_LOGIN_OTP_EXPIRY_MINUTES,
    resendAfterSeconds: Math.ceil(ADMIN_LOGIN_OTP_RESEND_COOLDOWN_MS / 1000),
  }
}

export const verifyAdminLoginOtp = async (email, code) => {
  const account = await findLoginAdmin(email)
  const trimmedCode = String(code || '').trim()

  if (!/^\d{6}$/.test(trimmedCode)) {
    throw new AppError('Enter the 6-digit code from the email', 400)
  }

  const admin = await Admin.findById(account._id).select(OTP_SELECT)
  if (!admin?.loginOtpHash || !admin.loginOtpExpiresAt) {
    throw new AppError('Request a new code and try again', 401)
  }

  if (admin.loginOtpExpiresAt.getTime() < Date.now()) {
    await clearLoginOtp(admin._id)
    throw new AppError('That code has expired. Request a new one.', 401)
  }

  if ((admin.loginOtpAttempts || 0) >= ADMIN_LOGIN_OTP_MAX_ATTEMPTS) {
    await clearLoginOtp(admin._id)
    throw new AppError('Too many attempts. Request a new code.', 401)
  }

  const incoming = hashOtp(trimmedCode)
  const stored = admin.loginOtpHash
  const matches =
    incoming.length === stored.length &&
    crypto.timingSafeEqual(Buffer.from(incoming), Buffer.from(stored))

  if (!matches) {
    const attempts = (admin.loginOtpAttempts || 0) + 1
    if (attempts >= ADMIN_LOGIN_OTP_MAX_ATTEMPTS) {
      await clearLoginOtp(admin._id)
      throw new AppError('Too many attempts. Request a new code.', 401)
    }
    await Admin.updateOne({ _id: admin._id }, { $set: { loginOtpAttempts: attempts } })
    throw new AppError('That code is incorrect.', 401)
  }

  await clearLoginOtp(admin._id)
  return admin
}

export const formatAdminResponse = (admin) => ({
  id: admin._id.toString(),
  email: admin.email,
  name: admin.name,
  role: 'admin',
  isSuperAdmin: Boolean(admin.isSuperAdmin),
  permissions: admin.permissions || [],
})

export const getAdminById = async (adminId) => {
  const admin = await Admin.findById(adminId)

  if (!admin) {
    throw new AppError('Admin account not found', 401)
  }

  return admin
}
