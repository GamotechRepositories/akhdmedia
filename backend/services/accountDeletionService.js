import crypto from 'crypto'
import { isEmailConfigured } from '../config/email.js'
import Admin from '../models/Admin.js'
import DeletedAccount from '../models/DeletedAccount.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import AppError from '../utils/AppError.js'
import { sendAccountDeletionCodeEmail } from './emailService.js'

const ACCOUNT_DELETION_CODE_EXPIRY_MS = 10 * 60 * 1000
const MIN_REASON_LENGTH = 5
const MAX_REASON_LENGTH = 500

const hashCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex')

const createDeletionCode = () => String(Math.floor(100000 + Math.random() * 900000))

const normalizeReason = (reason = '') => String(reason || '').trim()

const validateReason = (reason) => {
  const trimmed = normalizeReason(reason)

  if (!trimmed) {
    throw new AppError('Please share a reason for deleting your account', 400)
  }

  if (trimmed.length < MIN_REASON_LENGTH) {
    throw new AppError(`Reason must be at least ${MIN_REASON_LENGTH} characters`, 400)
  }

  if (trimmed.length > MAX_REASON_LENGTH) {
    throw new AppError(`Reason must be at most ${MAX_REASON_LENGTH} characters`, 400)
  }

  return trimmed
}

export const archiveAndDeleteUser = async ({
  user,
  reason,
  deletedBy,
  admin = null,
}) => {
  const trimmedReason = validateReason(reason)

  await DeletedAccount.create({
    originalUserId: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    reason: trimmedReason,
    accountCreatedAt: user.createdAt || null,
    deletedBy,
    deletedByAdminId: admin?.id || admin?._id || null,
    deletedByAdminName: admin?.name || '',
    deletedAt: new Date(),
  })

  await Order.updateMany({ userId: user._id }, { $set: { userId: null } })
  await user.deleteOne()
}

export const requestAccountDeletion = async (userId, reason) => {
  const trimmedReason = validateReason(reason)

  if (!isEmailConfigured()) {
    throw new AppError('Email is not configured. Account deletion codes cannot be sent.', 503)
  }

  const user = await User.findById(userId).select('+accountDeletionCode +accountDeletionReason')

  if (!user) {
    throw new AppError('Account not found', 404)
  }

  if (user.role === 'admin') {
    throw new AppError('Admin accounts cannot be deleted here', 400)
  }

  const linkedAdmin = await Admin.findOne({ email: user.email })
  if (linkedAdmin) {
    throw new AppError('This email belongs to an admin account', 400)
  }

  const code = createDeletionCode()
  user.accountDeletionCode = hashCode(code)
  user.accountDeletionExpires = new Date(Date.now() + ACCOUNT_DELETION_CODE_EXPIRY_MS)
  user.accountDeletionReason = trimmedReason
  await user.save()

  const emailResult = await sendAccountDeletionCodeEmail({
    email: user.email,
    name: user.name,
    code,
    expiryMinutes: 10,
  })

  if (!emailResult?.sent) {
    throw new AppError('Could not send confirmation code. Please try again later.', 503)
  }

  return {
    email: user.email,
    expiresInMinutes: 10,
  }
}

export const confirmAccountDeletion = async (userId, code) => {
  const trimmedCode = String(code || '').trim()

  if (!/^\d{6}$/.test(trimmedCode)) {
    throw new AppError('Please enter the 6-digit confirmation code', 400)
  }

  const user = await User.findById(userId).select(
    '+accountDeletionCode +accountDeletionExpires +accountDeletionReason',
  )

  if (!user) {
    throw new AppError('Account not found', 404)
  }

  if (
    !user.accountDeletionCode ||
    !user.accountDeletionExpires ||
    user.accountDeletionExpires.getTime() < Date.now()
  ) {
    throw new AppError('Confirmation code is invalid or has expired. Please request a new one.', 400)
  }

  if (user.accountDeletionCode !== hashCode(trimmedCode)) {
    throw new AppError('Invalid confirmation code', 400)
  }

  const reason = user.accountDeletionReason || 'No reason provided'
  await archiveAndDeleteUser({
    user,
    reason,
    deletedBy: 'user',
  })
}

export const listDeletedAccounts = async ({ page, limit, skip, search = '' }) => {
  const filter = {}
  const trimmedSearch = String(search || '').trim()

  if (trimmedSearch) {
    const regex = new RegExp(trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }, { reason: regex }]
  }

  const [accounts, total] = await Promise.all([
    DeletedAccount.find(filter)
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DeletedAccount.countDocuments(filter),
  ])

  return {
    accounts: accounts.map((account) => ({
      id: account._id.toString(),
      originalUserId: account.originalUserId?.toString() || '',
      name: account.name,
      email: account.email,
      phone: account.phone || '',
      reason: account.reason,
      accountCreatedAt: account.accountCreatedAt || null,
      deletedBy: account.deletedBy,
      deletedByAdminName: account.deletedByAdminName || '',
      deletedAt: account.deletedAt,
    })),
    total,
  }
}
