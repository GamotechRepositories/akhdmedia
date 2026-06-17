import asyncHandler from '../utils/asyncHandler.js'
import AppError from '../utils/AppError.js'
import Order from '../models/Order.js'
import User from '../models/User.js'

const formatUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
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
    throw new AppError('Admin accounts cannot be deleted', 400)
  }

  if (user._id.toString() === req.admin.id) {
    throw new AppError('You cannot delete your own account', 400)
  }

  await Order.updateMany({ userId: user._id }, { $set: { userId: null } })
  await user.deleteOne()

  res.json({
    success: true,
    message: 'User deleted successfully',
  })
})
