import { buildTokenSearchFilter } from './pagination.js'

const TRANSACTION_SEARCH_FIELDS = [
  'orderNumber',
  'razorpayOrderId',
  'razorpayPaymentId',
  'billingAddress.name',
  'billingAddress.email',
  'billingAddress.phone',
  'items.name',
  'items.clipId',
  'items.licenseNumber',
  'items.productId',
  'items.brand',
]

export const buildTransactionListFilter = (query = {}) => {
  const filter = {
    paymentStatus: { $in: ['paid', 'invoice', 'failed'] },
  }
  const status = String(query.status || 'all')
  const month = Number(query.month)
  const year = Number(query.year)

  if (status === 'successful') {
    filter.paymentStatus = { $in: ['paid', 'invoice'] }
  } else if (status === 'failed') {
    filter.paymentStatus = 'failed'
  }

  const searchFilter = buildTokenSearchFilter(query.search, TRANSACTION_SEARCH_FIELDS)
  if (searchFilter.$and) {
    filter.$and = [...(filter.$and || []), ...searchFilter.$and]
  }

  const hasValidYear = Number.isInteger(year) && year >= 1970
  const hasValidMonth = Number.isInteger(month) && month >= 1 && month <= 12

  if (hasValidYear) {
    const rangeStart = hasValidMonth ? new Date(Date.UTC(year, month - 1, 1)) : new Date(Date.UTC(year, 0, 1))
    const rangeEnd = hasValidMonth ? new Date(Date.UTC(year, month, 1)) : new Date(Date.UTC(year + 1, 0, 1))
    filter.createdAt = {
      $gte: rangeStart,
      $lt: rangeEnd,
    }
  }

  return filter
}
