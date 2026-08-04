import Order from '../models/Order.js'

const PAID_ORDER_MATCH = { paymentStatus: 'paid' }

export const getUserOrderStatsMaps = async () => {
  const [byUserId, byEmail] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          ...PAID_ORDER_MATCH,
          userId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ['$totalAmount', 0] } },
        },
      },
    ]),
    Order.aggregate([
      {
        $match: {
          ...PAID_ORDER_MATCH,
          $or: [{ userId: null }, { userId: { $exists: false } }],
          'billingAddress.email': { $exists: true, $nin: ['', null] },
        },
      },
      {
        $group: {
          _id: { $toLower: { $trim: { input: '$billingAddress.email' } } },
          orderCount: { $sum: 1 },
          totalSpent: { $sum: { $ifNull: ['$totalAmount', 0] } },
        },
      },
    ]),
  ])

  return {
    userIdMap: new Map(
      byUserId.map((row) => [
        String(row._id),
        { orderCount: row.orderCount, totalSpent: row.totalSpent },
      ]),
    ),
    emailMap: new Map(
      byEmail.map((row) => [
        String(row._id),
        { orderCount: row.orderCount, totalSpent: row.totalSpent },
      ]),
    ),
  }
}

export const resolveUserOrderStats = (user, userIdMap, emailMap) => {
  const userId = user._id?.toString() || user.id || ''
  const email = String(user.email || '')
    .trim()
    .toLowerCase()

  const byId = userIdMap.get(userId) || { orderCount: 0, totalSpent: 0 }
  const byEmail = email ? emailMap.get(email) || { orderCount: 0, totalSpent: 0 } : { orderCount: 0, totalSpent: 0 }

  return {
    orderCount: byId.orderCount + byEmail.orderCount,
    totalSpent: byId.totalSpent + byEmail.totalSpent,
  }
}

export const attachUserOrderStats = (users = [], userIdMap, emailMap) =>
  users.map((user) => {
    const stats = resolveUserOrderStats(user, userIdMap, emailMap)
    return {
      ...user,
      orderCount: stats.orderCount,
      totalSpent: stats.totalSpent,
    }
  })

export const sortUsersByOrderStats = (users = [], sortKey = 'all') => {
  if (sortKey !== 'orders' && sortKey !== 'spend') {
    return [...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  return [...users].sort((a, b) => {
    if (sortKey === 'orders') {
      if (a.orderCount !== b.orderCount) return b.orderCount - a.orderCount
      if (a.totalSpent !== b.totalSpent) return b.totalSpent - a.totalSpent
    } else {
      if (a.totalSpent !== b.totalSpent) return b.totalSpent - a.totalSpent
      if (a.orderCount !== b.orderCount) return b.orderCount - a.orderCount
    }

    return new Date(b.createdAt) - new Date(a.createdAt)
  })
}
