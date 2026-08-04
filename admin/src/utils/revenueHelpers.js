export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

export const formatDayLabel = (date) =>
  date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

export const formatDateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const parseMonthKey = (monthKey) => {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey || '')
  if (!match) return null

  const year = match[1]
  const monthIndex = Number(match[2]) - 1
  if (monthIndex < 0 || monthIndex > 11) return null

  return {
    key: monthKey,
    year,
    month: monthIndex,
    label: `${MONTH_LABELS[monthIndex]} ${year}`,
  }
}

export const parseDayKey = (dayKey) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey || '')
  if (!match) return null

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  if (monthIndex < 0 || monthIndex > 11 || day < 1 || day > 31) return null

  const date = new Date(year, monthIndex, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return null
  }

  return {
    key: dayKey,
    monthKey: getMonthKeyFromDate(date),
    year: String(year),
    month: monthIndex,
    day,
    label: formatDayLabel(date),
  }
}

export const getMonthKeyFromDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

export const getDayKeyFromDate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const emptyBucket = (key, year, month, label) => ({
  key,
  year,
  month,
  label,
  totalRevenue: 0,
  totalTransactions: 0,
  paidTransactions: 0,
  failedTransactions: 0,
  pendingTransactions: 0,
})

export const applyTxnToBucket = (bucket, txn) => {
  bucket.totalTransactions += 1
  if (txn.transactionStatus === 'successful') {
    bucket.paidTransactions += 1
    bucket.totalRevenue += Number(txn.amount) || 0
  } else if (txn.transactionStatus === 'failed') {
    bucket.failedTransactions += 1
  } else {
    bucket.pendingTransactions += 1
  }
}

export const withAvg = (row) => ({
  ...row,
  avgOrderValue: row.paidTransactions ? row.totalRevenue / row.paidTransactions : 0,
})

export const buildMonthlyRows = (transactions, selectedYear = 'all') => {
  const buckets = new Map()

  for (const txn of transactions) {
    if (!txn.createdAt) continue
    const date = new Date(txn.createdAt)
    if (Number.isNaN(date.getTime())) continue

    const year = String(date.getFullYear())
    if (selectedYear !== 'all' && year !== selectedYear) continue

    const month = date.getMonth()
    const key = getMonthKeyFromDate(date)

    if (!buckets.has(key)) {
      buckets.set(key, emptyBucket(key, year, month, `${MONTH_LABELS[month]} ${year}`))
    }

    applyTxnToBucket(buckets.get(key), txn)
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.key.localeCompare(a.key))
    .map(withAvg)
}

export const filterTransactionsByMonth = (transactions, monthKey) =>
  transactions
    .filter((txn) => {
      if (!txn.createdAt) return false
      const date = new Date(txn.createdAt)
      if (Number.isNaN(date.getTime())) return false
      return getMonthKeyFromDate(date) === monthKey
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

export const filterTransactionsByDay = (transactions, dayKey) =>
  transactions
    .filter((txn) => {
      if (!txn.createdAt) return false
      const date = new Date(txn.createdAt)
      if (Number.isNaN(date.getTime())) return false
      return getDayKeyFromDate(date) === dayKey
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

export const buildDailyRows = (monthTransactions) => {
  const buckets = new Map()

  for (const txn of monthTransactions) {
    const date = new Date(txn.createdAt)
    const dayKey = getDayKeyFromDate(date)

    if (!buckets.has(dayKey)) {
      buckets.set(
        dayKey,
        emptyBucket(dayKey, String(date.getFullYear()), date.getMonth(), formatDayLabel(date)),
      )
    }

    applyTxnToBucket(buckets.get(dayKey), txn)
  }

  return Array.from(buckets.values())
    .sort((a, b) => b.key.localeCompare(a.key))
    .map(withAvg)
}

export const statusStyles = {
  successful: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
  pending: 'bg-amber-50 text-amber-700',
}
