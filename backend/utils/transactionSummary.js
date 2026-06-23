import Order from '../models/Order.js'

export const getTransactionSummary = async () => {
  const [total, successful, failed, pending, amountAgg] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ paymentStatus: { $in: ['paid', 'invoice'] } }),
    Order.countDocuments({ paymentStatus: 'failed' }),
    Order.countDocuments({ paymentStatus: 'pending' }),
    Order.aggregate([
      { $match: { paymentStatus: { $in: ['paid', 'invoice'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
  ])

  const successfulAmount = amountAgg[0]?.total || 0

  return {
    total,
    successful,
    failed,
    pending,
    successfulAmount,
    revenue: successfulAmount,
  }
}
