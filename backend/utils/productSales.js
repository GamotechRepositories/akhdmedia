import Order from '../models/Order.js'

export const EMPTY_PRODUCT_SALES_STATS = { soldCount: 0, totalRevenue: 0 }

/**
 * Returns Map<productId, { soldCount, totalRevenue }> from paid/invoice orders.
 */
export const getProductSalesStatsMap = async (productIds = null) => {
  const match = {
    paymentStatus: { $in: ['paid', 'invoice'] },
  }

  if (Array.isArray(productIds) && productIds.length > 0) {
    match['items.productId'] = { $in: productIds.map(String) }
  }

  const rows = await Order.aggregate([
    { $match: match },
    { $unwind: '$items' },
    ...(Array.isArray(productIds) && productIds.length > 0
      ? [{ $match: { 'items.productId': { $in: productIds.map(String) } } }]
      : []),
    {
      $group: {
        _id: '$items.productId',
        soldCount: { $sum: { $ifNull: ['$items.quantity', 1] } },
        totalRevenue: {
          $sum: {
            $ifNull: ['$items.lineTotal', { $multiply: ['$items.price', '$items.quantity'] }],
          },
        },
      },
    },
  ])

  return new Map(
    rows.map((row) => [
      String(row._id),
      {
        soldCount: Number(row.soldCount) || 0,
        totalRevenue: Number(row.totalRevenue) || 0,
      },
    ]),
  )
}

/** @deprecated Use getProductSalesStatsMap */
export const getProductSalesCountMap = getProductSalesStatsMap

export const getProductSalesStats = (salesMap, productId) =>
  salesMap.get(String(productId)) || EMPTY_PRODUCT_SALES_STATS
