import Order from '../models/Order.js'
import UserSubscription from '../models/UserSubscription.js'

export const getTransactionSummary = async () => {
  const orderBaseFilter = {
    paymentMethod: { $ne: 'subscription' },
    totalAmount: { $gt: 0 },
  }

  const [
    orderTotal,
    orderSuccessful,
    orderFailed,
    orderAmountAgg,
    subTotal,
    subSuccessful,
    subFailed,
    subAmountAgg,
  ] = await Promise.all([
    Order.countDocuments({ ...orderBaseFilter, paymentStatus: { $in: ['paid', 'invoice', 'failed'] } }),
    Order.countDocuments({ ...orderBaseFilter, paymentStatus: { $in: ['paid', 'invoice'] } }),
    Order.countDocuments({ ...orderBaseFilter, paymentStatus: 'failed' }),
    Order.aggregate([
      { $match: { ...orderBaseFilter, paymentStatus: { $in: ['paid', 'invoice'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    UserSubscription.countDocuments({
      $or: [
        { paymentStatus: { $in: ['paid', 'invoice', 'failed'] } },
        { status: { $in: ['active', 'cancelled'] } },
      ],
    }),
    UserSubscription.countDocuments({
      $or: [
        { paymentStatus: { $in: ['paid', 'invoice'] } },
        { status: 'active' },
      ],
    }),
    UserSubscription.countDocuments({
      $or: [
        { paymentStatus: 'failed' },
        { status: 'cancelled' },
      ],
    }),
    UserSubscription.aggregate([
      {
        $match: {
          $or: [
            { paymentStatus: { $in: ['paid', 'invoice'] } },
            { status: 'active' },
          ],
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $ifNull: ['$amountPaid', { $ifNull: ['$totalAmount', '$price'] }],
            },
          },
        },
      },
    ]),
  ])

  const orderRevenue = orderAmountAgg[0]?.total || 0
  const subRevenue = subAmountAgg[0]?.total || 0
  const totalRevenue = orderRevenue + subRevenue

  return {
    total: orderTotal + subTotal,
    successful: orderSuccessful + subSuccessful,
    failed: orderFailed + subFailed,
    successfulAmount: totalRevenue,
    revenue: totalRevenue,
    orderRevenue,
    subscriptionRevenue: subRevenue,
  }
}
