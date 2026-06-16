import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fetchTransactions } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import PageHeader from '../components/PageHeader'
import { cardClass, inputClass, secondaryBtnClass } from '../components/ui/adminUi'

const PURCHASE_REASON_LABELS = {
  personal: 'Personal collection',
  digital: 'Digital media',
  outlet: 'Outlet media',
  other: 'Other',
}

const formatPurchaseReason = (reason, otherText = '') => {
  if (reason === 'other' && otherText.trim()) {
    return `Other: ${otherText.trim()}`
  }
  return PURCHASE_REASON_LABELS[reason] || reason
}

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusStyles = {
  successful: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-700',
  pending: 'bg-amber-50 text-amber-700',
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'successful', label: 'Successful' },
  { id: 'failed', label: 'Failed' },
  { id: 'pending', label: 'Pending' },
]

const shortOrderNumber = (orderNumber = '') => orderNumber?.slice(-8).toUpperCase() || ''

const buildTransactionSearchText = (txn) => {
  const reasons = (txn.purchaseReasons || [])
    .map((reason) => formatPurchaseReason(reason, txn.purchaseReasonOther))
    .join(' ')

  const itemFields = (txn.items || []).flatMap((item) => [
    item.name,
    item.clipId,
    item.licenseNumber,
    item.imageSize,
    item.productId,
    item.brand,
    String(item.quantity ?? ''),
    String(item.price ?? ''),
    String(item.lineTotal ?? ''),
    formatCurrency(item.price),
    formatCurrency(item.lineTotal),
  ])

  return [
    txn.id,
    txn.transactionId,
    txn.orderId,
    txn.orderNumber,
    shortOrderNumber(txn.orderNumber),
    txn.customerName,
    txn.customerEmail,
    txn.customerPhone,
    reasons,
    txn.paymentMethod,
    'online',
    'online payment',
    txn.paymentStatus,
    txn.transactionStatus,
    txn.transactionStatusLabel,
    txn.orderStatus,
    txn.razorpayOrderId,
    txn.razorpayPaymentId,
    txn.currency,
    String(txn.amount ?? ''),
    formatCurrency(txn.amount),
    formatDate(txn.createdAt),
    ...itemFields,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const matchesSearch = (txn, query) => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  const haystack = buildTransactionSearchText(txn)
  const tokens = normalized.split(/\s+/).filter(Boolean)
  return tokens.every((token) => haystack.includes(token))
}

const Transactions = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const tableContainerRef = useRef(null)
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [filter, setFilter] = useState(location.state?.restore?.filter || 'all')
  const [searchQuery, setSearchQuery] = useState(location.state?.restore?.searchQuery || '')
  const [highlightedId, setHighlightedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchTransactions()
        setTransactions(response.data.data?.transactions || [])
        setSummary(response.data.data?.summary || null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      if (filter !== 'all' && txn.transactionStatus !== filter) {
        return false
      }
      return matchesSearch(txn, searchQuery)
    })
  }, [transactions, filter, searchQuery])

  useEffect(() => {
    const restore = location.state?.restore
    if (!restore || loading) return

    if (restore.filter) {
      setFilter(restore.filter)
    }

    if (restore.searchQuery !== undefined) {
      setSearchQuery(restore.searchQuery)
    }

    const frame = requestAnimationFrame(() => {
      if (tableContainerRef.current && typeof restore.scrollTop === 'number') {
        tableContainerRef.current.scrollTop = restore.scrollTop
      }

      if (restore.transactionId) {
        setHighlightedId(restore.transactionId)
        const row = document.getElementById(`txn-row-${restore.transactionId}`)
        row?.scrollIntoView({ block: 'center', behavior: 'auto' })
        window.setTimeout(() => setHighlightedId(''), 2500)
      }

      navigate('/transactions', { replace: true, state: {} })
    })

    return () => cancelAnimationFrame(frame)
  }, [loading, location.state, navigate])

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sales"
        title="Transactions"
        description="All payment transactions. Click View for full details."
      />

      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className={`${cardClass} p-5`}>
            <p className="text-sm text-slate-500">Total transactions</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.total}</p>
          </div>
          <div className={`${cardClass} p-5`}>
            <p className="text-sm text-slate-500">Successful</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{summary.successful}</p>
            <p className="mt-1 text-xs text-slate-400">Paid online only</p>
          </div>
          <div className={`${cardClass} p-5`}>
            <p className="text-sm text-slate-500">Failed</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{summary.failed}</p>
          </div>
          <div className={`${cardClass} p-5`}>
            <p className="text-sm text-slate-500">Pending</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{summary.pending}</p>
          </div>
          <div className={`${cardClass} p-5`}>
            <p className="text-sm text-slate-500">Successful amount</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatCurrency(summary.successfulAmount)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Razorpay paid</p>
          </div>
          <div className={`${cardClass} p-5`}>
            <p className="text-sm text-slate-500">Revenue</p>
            <p className="mt-2 text-2xl font-bold text-violet-600">
              {formatCurrency(summary.revenue ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Paid online</p>
          </div>
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search transactions
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, email, phone, order no, Razorpay ID, clip ID, license no, product..."
              className={inputClass}
            />
          </label>
          {searchQuery.trim() && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear search
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                filter === item.id
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {!loading && (
          <p className="text-xs text-slate-500">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
        )}
      </div>

      <div
        ref={tableContainerRef}
        className={`${cardClass} max-h-[min(60vh,640px)] min-h-[240px] overflow-y-auto`}
      >
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Date</th>
              <th className="px-4 py-3 whitespace-nowrap">Customer</th>
              <th className="px-4 py-3 whitespace-nowrap">Items</th>
              <th className="px-4 py-3 whitespace-nowrap">Status</th>
              <th className="px-4 py-3 whitespace-nowrap">Amount</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading transactions...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {transactions.length === 0
                    ? 'No transactions found.'
                    : 'No transactions match your search or filters.'}
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn) => (
                <tr
                  key={txn.id}
                  id={`txn-row-${txn.id}`}
                  className={`hover:bg-slate-50/80 ${
                    highlightedId === txn.id ? 'bg-amber-50 ring-1 ring-inset ring-amber-200' : ''
                  }`}
                >
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {formatDate(txn.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{txn.customerName || '—'}</p>
                    <p className="text-xs text-slate-500">{txn.customerEmail || '—'}</p>
                    <p className="text-xs text-slate-500">{txn.customerPhone || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <p className="text-xs text-slate-700">
                      {txn.itemCount || txn.items?.length || 0} item
                      {(txn.itemCount || txn.items?.length || 0) === 1 ? '' : 's'}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        statusStyles[txn.transactionStatus] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {txn.transactionStatusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                    {formatCurrency(txn.amount)}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      to={`/transactions/${txn.id}`}
                      state={{
                        fromList: {
                          filter,
                          searchQuery,
                          scrollTop: tableContainerRef.current?.scrollTop ?? 0,
                          transactionId: txn.id,
                        },
                      }}
                      className={secondaryBtnClass}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AdminAlertModal
        open={Boolean(error)}
        title="Could not load transactions"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default Transactions
