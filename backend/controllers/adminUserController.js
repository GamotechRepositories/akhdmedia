import asyncHandler from '../utils/asyncHandler.js'
import AppError from '../utils/AppError.js'
import mongoose from 'mongoose'
import Admin from '../models/Admin.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import UserEmailLog from '../models/UserEmailLog.js'
import { getOrdersForUser } from '../services/orderService.js'
import { sendAdminBroadcastEmail } from '../services/emailService.js'
import { getResendFrom } from '../config/email.js'
import { prepareEmailAttachmentsForSend } from '../utils/userEmailAttachments.js'
import { formatOrderResponse } from '../utils/formatCart.js'
import { buildPaginationMeta, buildTokenSearchFilter, parsePageLimit } from '../utils/pagination.js'

const USER_SEARCH_FIELDS = ['name', 'email', 'phone']

const normalizeFromAddress = (raw = '') => {
  const trimmed = String(raw || '').trim()
  if (!trimmed) return getResendFrom()

  const emailMatch = trimmed.match(/<([^>]+)>/)
  const email = (emailMatch ? emailMatch[1] : trimmed).trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError('Invalid from email address', 400)
  }

  return trimmed
}

const buildUserListFilter = (query = {}) => {
  const filter = { role: { $ne: 'admin' } }
  const searchFilter = buildTokenSearchFilter(query.search, USER_SEARCH_FIELDS)

  if (searchFilter.$and) {
    filter.$and = searchFilter.$and
  }

  return filter
}

const formatUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role || 'user',
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || '').trim())

export const listUsers = asyncHandler(async (req, res) => {
  const pagination = parsePageLimit(req.query)

  if (pagination) {
    const { page, limit, skip } = pagination
    const filter = buildUserListFilter(req.query)

    const [users, total, latestUser, grandTotal] = await Promise.all([
      User.find(filter)
        .select('name email phone role createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
      User.findOne({ role: { $ne: 'admin' } })
        .sort({ createdAt: -1 })
        .select('createdAt')
        .lean(),
      User.countDocuments({ role: { $ne: 'admin' } }),
    ])

    res.json({
      success: true,
      data: {
        users: users.map(formatUser),
        pagination: buildPaginationMeta(page, limit, total),
        meta: {
          grandTotal,
          latestSignup: latestUser?.createdAt || null,
        },
      },
    })
    return
  }

  const users = await User.find({ role: { $ne: 'admin' } })
    .select('name email phone role createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean()

  res.json({
    success: true,
    data: {
      users: users.map(formatUser),
    },
  })
})

export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('name email phone role createdAt updatedAt')
    .lean()

  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (user.role === 'admin') {
    throw new AppError('Admin accounts are managed in Admin Team, not Users', 404)
  }

  const orders = await getOrdersForUser(user._id, user.email)
  const formattedOrders = orders.map((order) => formatOrderResponse(order))
  const paidOrders = formattedOrders.filter((order) => order.paymentStatus === 'paid')
  const totalSpent = paidOrders.reduce((sum, order) => sum + (Number(order.totalAmount) || 0), 0)

  res.json({
    success: true,
    data: {
      user: formatUser(user),
      orders: formattedOrders,
      orderStats: {
        totalOrders: formattedOrders.length,
        paidOrders: paidOrders.length,
        totalSpent,
        firstOrderAt: formattedOrders.length
          ? formattedOrders[formattedOrders.length - 1].createdAt
          : null,
        lastOrderAt: formattedOrders.length ? formattedOrders[0].createdAt : null,
      },
    },
  })
})

export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new AppError('User not found', 404)
  }

  if (user.role === 'admin') {
    throw new AppError('Admin accounts are managed in Admin Team, not Users', 400)
  }

  const linkedAdmin = await Admin.findOne({ email: user.email })
  if (linkedAdmin) {
    throw new AppError('This email belongs to an admin account', 400)
  }

  await Order.updateMany({ userId: user._id }, { $set: { userId: null } })
  await user.deleteOne()

  res.json({
    success: true,
    message: 'User deleted successfully',
  })
})

export const getUserEmailSettings = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      from: getResendFrom(),
    },
  })
})

export const sendUserEmail = asyncHandler(async (req, res) => {
  const subject = String(req.body?.subject || '').trim()
  const message = String(req.body?.message || '').trim()
  const from = normalizeFromAddress(req.body?.from)
  const target = String(req.body?.target || '').trim()
  const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds : []
  const userId = String(req.body?.userId || '').trim()

  if (!subject || subject.length < 3) {
    throw new AppError('Subject must be at least 3 characters', 400)
  }

  if (!message || message.length < 5) {
    throw new AppError('Message must be at least 5 characters', 400)
  }

  let users = []
  if (target === 'all') {
    users = await User.find({ role: { $ne: 'admin' } }).select('name email').lean()
  } else if (target === 'selected') {
    const normalizedIds = [
      ...new Set(
        userIds
          .map((value) => String(value || '').trim())
          .filter((value) => value && isValidObjectId(value)),
      ),
    ]
    if (!normalizedIds.length) {
      throw new AppError('Please select at least one user', 400)
    }
    users = await User.find({ _id: { $in: normalizedIds }, role: { $ne: 'admin' } })
      .select('name email')
      .lean()
  } else if (target === 'single') {
    if (!userId || !isValidObjectId(userId)) {
      throw new AppError('User ID is required for single email', 400)
    }
    users = await User.find({ _id: userId, role: { $ne: 'admin' } }).select('name email').lean()
  } else {
    throw new AppError('Invalid email target', 400)
  }

  const recipients = users.map((user) => user.email).filter(Boolean)
  if (!recipients.length) {
    throw new AppError('No valid recipients found', 400)
  }

  const rawAttachments = Array.isArray(req.body?.attachments) ? req.body.attachments : []
  const { stored: attachmentMeta, resend: resendAttachments } =
    await prepareEmailAttachmentsForSend(rawAttachments)

  const result = await sendAdminBroadcastEmail({
    recipients,
    subject,
    message,
    from,
    attachments: resendAttachments,
  })

  if (!result.sent) {
    throw new AppError('Email could not be sent. Please check email configuration.', 500)
  }

  const failedByEmail = new Map(
    (result.failed || []).map((item) => [String(item.email || '').toLowerCase(), item.error || 'Unknown error']),
  )
  const now = new Date()
  const logs = users
    .filter((user) => user.email)
    .map((user) => {
      const normalizedEmail = String(user.email).toLowerCase()
      const failedReason = failedByEmail.get(normalizedEmail)

      return {
        userId: user._id,
        userEmail: normalizedEmail,
        userName: user.name || '',
        adminId: req.admin.id,
        adminName: req.admin.name || '',
        subject,
        message,
        target,
        attachments: attachmentMeta,
        status: failedReason ? 'failed' : 'sent',
        errorMessage: failedReason || '',
        sentAt: now,
      }
    })

  if (logs.length) {
    await UserEmailLog.insertMany(logs, { ordered: false })
  }

  res.json({
    success: true,
    message: `Sent ${result.sentCount} of ${result.total} email(s).`,
    data: {
      target,
      requestedRecipients: recipients.length,
      sentCount: result.sentCount,
      failedCount: result.failedCount,
      failed: result.failed.slice(0, 20),
    },
  })
})

export const getUserEmailHistory = asyncHandler(async (req, res) => {
  const userId = String(req.params.id || '').trim()
  if (!isValidObjectId(userId)) {
    throw new AppError('User not found', 404)
  }

  const user = await User.findById(userId).select('name email role').lean()
  if (!user || user.role === 'admin') {
    throw new AppError('User not found', 404)
  }

  const logs = await UserEmailLog.find({ userId: user._id })
    .sort({ sentAt: -1, createdAt: -1 })
    .select('subject message target status errorMessage sentAt adminName attachments')
    .lean()

  res.json({
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
      },
      history: logs.map((log) => ({
        id: log._id.toString(),
        subject: log.subject,
        message: log.message,
        target: log.target,
        status: log.status,
        errorMessage: log.errorMessage || '',
        sentAt: log.sentAt,
        adminName: log.adminName || '',
        attachments: (log.attachments || []).map((attachment) => ({
          filename: attachment.filename || '',
          contentType: attachment.contentType || '',
          url: attachment.url || '',
          size: attachment.size || 0,
        })),
      })),
    },
  })
})

export const getSavedUserSelection = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin.id).select('userEmailSelection').lean()
  const userIds = (admin?.userEmailSelection?.userIds || []).map((id) => id.toString())

  res.json({
    success: true,
    data: {
      userIds,
      updatedAt: admin?.userEmailSelection?.updatedAt || null,
    },
  })
})

export const saveUserSelection = asyncHandler(async (req, res) => {
  const incomingUserIds = Array.isArray(req.body?.userIds) ? req.body.userIds : []
  const normalizedIds = [
    ...new Set(
      incomingUserIds
        .map((value) => String(value || '').trim())
        .filter((value) => value && isValidObjectId(value)),
    ),
  ]

  const validUsers = await User.find({
    _id: { $in: normalizedIds },
    role: { $ne: 'admin' },
  })
    .select('_id')
    .lean()

  const validUserIds = validUsers.map((user) => user._id.toString())

  await Admin.updateOne(
    { _id: req.admin.id },
    {
      $set: {
        userEmailSelection: {
          userIds: validUserIds,
          updatedAt: new Date(),
        },
      },
    },
  )

  res.json({
    success: true,
    data: {
      userIds: validUserIds,
      count: validUserIds.length,
    },
  })
})
