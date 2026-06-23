import { buildTokenSearchFilter } from './pagination.js'

const ORDER_SEARCH_FIELDS = [
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

export const buildOrderListFilter = (query = {}) => {
  const filter = {}
  const paymentStatus = String(query.paymentStatus || 'all')
  const status = String(query.status || 'all')
  const customerEmail = String(query.customerEmail || '').trim().toLowerCase()
  const dateFrom = String(query.dateFrom || '').trim()
  const dateTo = String(query.dateTo || '').trim()

  if (paymentStatus !== 'all') {
    filter.paymentStatus = paymentStatus
  }

  if (status !== 'all') {
    filter.status = status
  }

  if (customerEmail) {
    filter['billingAddress.email'] = new RegExp(
      `^${customerEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
      'i',
    )
  }

  if (dateFrom || dateTo) {
    filter.createdAt = {}
    if (dateFrom) {
      filter.createdAt.$gte = new Date(`${dateFrom}T00:00:00`)
    }
    if (dateTo) {
      filter.createdAt.$lte = new Date(`${dateTo}T23:59:59.999`)
    }
  }

  const searchFilter = buildTokenSearchFilter(query.search, ORDER_SEARCH_FIELDS)
  if (searchFilter.$and) {
    filter.$and = [...(filter.$and || []), ...searchFilter.$and]
  }

  return filter
}
