import asyncHandler from '../utils/asyncHandler.js'
import { getAdminOrderById, getAllOrders } from '../services/orderService.js'
import { formatTransactionResponse } from '../utils/formatTransaction.js'

export const listAdminTransactions = asyncHandler(async (req, res) => {
  const orders = await getAllOrders()
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
