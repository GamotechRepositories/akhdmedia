import Order from '../models/Order.js'

export const getTransactionSummary = async () => {
  const [total, successful, failed, amountAgg] = await Promise.all([
    Order.countDocuments({ paymentStatus: { $in: ['paid', 'invoice', 'failed'] } }),
    Order.countDocuments({ paymentStatus: { $in: ['paid', 'invoice'] } }),
    Order.countDocuments({ paymentStatus: 'failed' }),
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
    successfulAmount,
    revenue: successfulAmount,
  }
}
