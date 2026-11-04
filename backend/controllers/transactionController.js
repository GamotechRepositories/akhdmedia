import asyncHandler from '../utils/asyncHandler.js'
import Order from '../models/Order.js'
import UserSubscription from '../models/UserSubscription.js'
import { deleteAdminOrderById, getAdminOrderById } from '../services/orderService.js'
import {
  formatTransactionResponse,
  formatSubscriptionTransactionResponse,
} from '../utils/formatTransaction.js'
import { buildPaginationMeta, parsePageLimit } from '../utils/pagination.js'
import { buildTransactionListFilter } from '../utils/transactionFilters.js'
import { getTransactionSummary } from '../utils/transactionSummary.js'
import AppError from '../utils/AppError.js'

export const listAdminTransactions = asyncHandler(async (req, res) => {
  const pagination = parsePageLimit(req.query)

  if (pagination) {
    const { page, limit, skip } = pagination
    const filter = buildTransactionListFilter(req.query)

    const [orders, subscriptions, summary] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }),
      UserSubscription.find({
        $or: [
          { paymentStatus: { $in: ['paid', 'invoice', 'failed'] } },
          { status: { $in: ['active', 'cancelled'] } },
        ],
      })
        .populate('userId', 'name email phone')
        .populate('planId', 'name interval price videoQuota')
        .sort({ createdAt: -1 }),
      getTransactionSummary(),
    ])

    const formattedOrders = orders.map(formatTransactionResponse)
    const formattedSubs = subscriptions.map(formatSubscriptionTransactionResponse)

    // Filter subscriptions by status & search query if applicable
    let filteredSubs = formattedSubs
    const status = String(req.query.status || 'all')
    if (status === 'successful') {
      filteredSubs = filteredSubs.filter((t) => t.isSuccessful)
    } else if (status === 'failed') {
      filteredSubs = filteredSubs.filter((t) => t.transactionStatus === 'failed')
    }

    if (req.query.search) {
      const q = String(req.query.search).trim().toLowerCase()
      filteredSubs = filteredSubs.filter(
        (t) =>
          t.orderNumber?.toLowerCase().includes(q) ||
          t.customerName?.toLowerCase().includes(q) ||
          t.customerEmail?.toLowerCase().includes(q) ||
          t.customerPhone?.toLowerCase().includes(q) ||
          t.transactionId?.toLowerCase().includes(q),
      )
    }

    const combined = [...formattedOrders, ...filteredSubs].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    )

    const total = combined.length
    const paginated = combined.slice(skip, skip + limit)

    res.json({
      success: true,
      data: {
        transactions: paginated,
        pagination: buildPaginationMeta(page, limit, total),
        summary,
      },
    })
    return
  }

  // Non-paginated query (for Revenue summary, monthly & daily calculations)
  const [orders, subscriptions, summary] = await Promise.all([
    Order.find({
      paymentStatus: { $in: ['paid', 'invoice', 'failed'] },
      paymentMethod: { $ne: 'subscription' },
      totalAmount: { $gt: 0 },
    }).sort({ createdAt: -1 }),
    UserSubscription.find({
      $or: [
        { paymentStatus: { $in: ['paid', 'invoice', 'failed'] } },
        { status: { $in: ['active', 'cancelled'] } },
      ],
    })
      .populate('userId', 'name email phone')
      .populate('planId', 'name interval price videoQuota')
      .sort({ createdAt: -1 }),
    getTransactionSummary(),
  ])

  const formattedOrders = orders.map(formatTransactionResponse)
  const formattedSubs = subscriptions.map(formatSubscriptionTransactionResponse)

  const transactions = [...formattedOrders, ...formattedSubs].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )

  res.json({
    success: true,
    data: {
      transactions,
      summary,
    },
  })
})

export const getAdminTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    const order = await getAdminOrderById(id)
    if (order) {
      res.json({
        success: true,
        data: {
          transaction: formatTransactionResponse(order),
        },
      })
      return
    }
  } catch (err) {
    // ignore, fall through to subscription
  }

  const sub = await UserSubscription.findById(id)
    .populate('userId', 'name email phone')
    .populate('planId', 'name interval price videoQuota')

  if (sub) {
    res.json({
      success: true,
      data: {
        transaction: formatSubscriptionTransactionResponse(sub),
      },
    })
    return
  }

  throw new AppError('Transaction not found', 404)
})

export const deleteAdminTransaction = asyncHandler(async (req, res) => {
  const { id } = req.params

  try {
    await deleteAdminOrderById(id)
    res.json({
      success: true,
      message: 'Transaction deleted successfully',
    })
    return
  } catch (err) {
    // If not an order, try subscription
  }

  const deletedSub = await UserSubscription.findByIdAndDelete(id)
  if (deletedSub) {
    res.json({
      success: true,
      message: 'Subscription transaction deleted successfully',
    })
    return
  }

  throw new AppError('Transaction not found', 404)
})
