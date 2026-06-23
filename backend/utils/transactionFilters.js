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
  const filter = {}
  const status = String(query.status || 'all')

  if (status === 'successful') {
    filter.paymentStatus = { $in: ['paid', 'invoice'] }
  } else if (status === 'failed') {
    filter.paymentStatus = 'failed'
  } else if (status === 'pending') {
    filter.paymentStatus = 'pending'
  }

  const searchFilter = buildTokenSearchFilter(query.search, TRANSACTION_SEARCH_FIELDS)
  if (searchFilter.$and) {
    filter.$and = [...(filter.$and || []), ...searchFilter.$and]
  }

  return filter
}
