import * as XLSX from 'xlsx'

const formatDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const roundInr = (amount = 0) => Math.round(Number(amount) || 0)

const joinValues = (items = [], getter) =>
  items
    .map(getter)
    .filter((value) => value !== '' && value != null)
    .join(' | ')

const buildRows = (transactions = []) =>
  transactions.map((txn, index) => {
    const items = txn.items || []
    return {
      '#': index + 1,
      'Transaction ID': txn.id || '',
      'Order ID': txn.orderId || '',
      'Order Number': txn.orderNumber || '',
      Date: formatDate(txn.createdAt),
      'Customer Name': txn.customerName || '',
      'Customer Email': txn.customerEmail || '',
      'Customer Phone': txn.customerPhone || '',
      Status: txn.transactionStatusLabel || txn.transactionStatus || '',
      'Payment Status': txn.paymentStatus || '',
      Amount: roundInr(txn.amount),
      Currency: txn.currency || 'INR',
      'Item Count': txn.itemCount || items.length || 0,
      'Product Names': joinValues(items, (item) => item.name),
      'Clip IDs': joinValues(items, (item) => item.clipId),
      'License Numbers': joinValues(items, (item) => item.licenseNumber),
      'Razorpay Payment ID': txn.razorpayPaymentId || '',
      'Last Updated': formatDate(txn.updatedAt),
    }
  })

export const downloadTransactionsExcel = (
  transactions = [],
  { scope = 'all' } = {},
) => {
  const rows = buildRows(transactions)
  const worksheet = XLSX.utils.json_to_sheet(rows)
  worksheet['!cols'] = [
    { wch: 5 },
    { wch: 24 },
    { wch: 24 },
    { wch: 20 },
    { wch: 20 },
    { wch: 24 },
    { wch: 30 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 36 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 20 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions')

  const date = new Date().toISOString().slice(0, 10)
  const suffix = scope === 'filtered' ? 'filtered' : 'all'
  XLSX.writeFile(workbook, `akhdmedia-transactions-${suffix}-${date}.xlsx`)
}
