import asyncHandler from '../utils/asyncHandler.js'
import AppError from '../utils/AppError.js'
import Admin from '../models/Admin.js'
import Order from '../models/Order.js'
import User from '../models/User.js'

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
