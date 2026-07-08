import asyncHandler from '../utils/asyncHandler.js'
import Order from '../models/Order.js'
import { getAdminOrderById } from '../services/orderService.js'
import { formatTransactionResponse } from '../utils/formatTransaction.js'
import { buildPaginationMeta, parsePageLimit } from '../utils/pagination.js'
import { buildTransactionListFilter } from '../utils/transactionFilters.js'
import { getTransactionSummary } from '../utils/transactionSummary.js'

export const listAdminTransactions = asyncHandler(async (req, res) => {
  const pagination = parsePageLimit(req.query)

  if (pagination) {
    const { page, limit, skip } = pagination
    const filter = buildTransactionListFilter(req.query)

    const [orders, total, summary] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
      getTransactionSummary(),
    ])

    res.json({
      success: true,
      data: {
        transactions: orders.map(formatTransactionResponse),
        pagination: buildPaginationMeta(page, limit, total),
        summary,
      },
    })
    return
  }

  const orders = await Order.find({
    paymentStatus: { $in: ['paid', 'invoice', 'failed'] },
  }).sort({ createdAt: -1 })
  const transactions = orders.map(formatTransactionResponse)

  const successfulTxns = transactions.filter((txn) => txn.transactionStatus === 'successful')

  const summary = {
    total: transactions.length,
    successful: successfulTxns.length,
    failed: transactions.filter((txn) => txn.transactionStatus === 'failed').length,
    pending: transactions.filter((txn) => txn.transactionStatus === 'pending').length,
    successfulAmount: successfulTxns.reduce((sum, txn) => sum + (txn.amount || 0), 0),
    revenue: successfulTxns.reduce((sum, txn) => sum + (txn.amount || 0), 0),
  }

  res.json({
    success: true,
    data: {
      transactions,
      summary,
    },
  })
})

export const getAdminTransaction = asyncHandler(async (req, res) => {
  const order = await getAdminOrderById(req.params.id)

  res.json({
    success: true,
    data: {
      transaction: formatTransactionResponse(order),
    },
  })
})
