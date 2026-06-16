import asyncHandler from '../utils/asyncHandler.js'
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
