import bcrypt from 'bcryptjs'
import asyncHandler from '../utils/asyncHandler.js'
import AppError from '../utils/AppError.js'
import User from '../models/User.js'
import {
  ADMIN_PERMISSION_GROUPS,
  normalizeAdminPermissions,
} from '../constants/adminPermissions.js'

const SALT_ROUNDS = 10

const formatAdminAccount = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  isSuperAdmin: Boolean(user.isSuperAdmin),
  permissions: user.permissions || [],
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

export const listPermissionGroups = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      groups: ADMIN_PERMISSION_GROUPS,
    },
  })
})

export const listAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: 'admin' })
    .select('name email phone isSuperAdmin permissions createdAt updatedAt')
    .sort({ createdAt: 1 })
    .lean()

  res.json({
    success: true,
    data: {
      admins: admins.map(formatAdminAccount),
    },
  })
})

export const getAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.params.id)

  if (!admin || admin.role !== 'admin') {
    throw new AppError('Admin account not found', 404)
  }

  res.json({
    success: true,
    data: {
      admin: formatAdminAccount(admin),
    },
  })
})

export const createAdmin = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim()
  const email = req.body.email?.trim().toLowerCase()
  const password = req.body.password || ''
  const permissions = normalizeAdminPermissions(req.body.permissions)

  if (!name || !email || !password) {
    throw new AppError('Name, email and password are required', 400)
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400)
  }

  const existing = await User.findOne({ email })
  if (existing) {
    throw new AppError('An account with this email already exists', 400)
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

  const admin = await User.create({
    name,
    email,
    password: hashedPassword,
    phone: req.body.phone?.trim() || '',
    role: 'admin',
    isSuperAdmin: false,
    permissions,
  })

  res.status(201).json({
    success: true,
    message: 'Admin account created',
    data: {
      admin: formatAdminAccount(admin),
    },
  })
})

export const updateAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.params.id)

  if (!admin || admin.role !== 'admin') {
    throw new AppError('Admin account not found', 404)
  }

  if (admin.isSuperAdmin && !req.adminProfile?.isSuperAdmin) {
    throw new AppError('Only the super admin can edit this account', 403)
  }

  if (admin._id.toString() === req.admin.id && req.body.isSuperAdmin === false) {
    throw new AppError('You cannot remove your own super admin access', 400)
  }

  if (req.body.name?.trim()) {
    admin.name = req.body.name.trim()
  }

  if (req.body.phone !== undefined) {
    admin.phone = req.body.phone?.trim() || ''
  }

  if (req.body.permissions !== undefined) {
    if (admin.isSuperAdmin) {
      admin.permissions = []
    } else {
      admin.permissions = normalizeAdminPermissions(req.body.permissions)
    }
  }

  if (req.body.password) {
    if (req.body.password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400)
    }
    admin.password = await bcrypt.hash(req.body.password, SALT_ROUNDS)
  }

  await admin.save()

  res.json({
    success: true,
    message: 'Admin account updated',
    data: {
      admin: formatAdminAccount(admin),
    },
  })
})

export const deleteAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.params.id)

  if (!admin || admin.role !== 'admin') {
    throw new AppError('Admin account not found', 404)
  }

  if (admin._id.toString() === req.admin.id) {
    throw new AppError('You cannot delete your own account', 400)
  }

  if (admin.isSuperAdmin) {
    throw new AppError('Super admin account cannot be deleted', 400)
  }

  await admin.deleteOne()

  res.json({
    success: true,
    message: 'Admin account deleted',
  })
})
