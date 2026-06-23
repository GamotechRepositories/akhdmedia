import asyncHandler from '../utils/asyncHandler.js'
import AppError from '../utils/AppError.js'
import Admin from '../models/Admin.js'
import Order from '../models/Order.js'
import User from '../models/User.js'
import { buildPaginationMeta, buildTokenSearchFilter, parsePageLimit } from '../utils/pagination.js'

const USER_SEARCH_FIELDS = ['name', 'email', 'phone']

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
