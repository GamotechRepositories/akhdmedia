import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fetchOrders } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import { cardClass, inputClass } from '../components/ui/adminUi'

const PAGE_SIZE = 50
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

const PAYMENT_FILTERS = [
  { id: 'all', label: 'All payments' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Payment pending' },
  { id: 'failed', label: 'Failed' },
]

const STATUS_FILTERS = [
  { id: 'all', label: 'All statuses' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'pending', label: 'Order pending' },
  { id: 'completed', label: 'Completed' },
]

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

const shortOrderNumber = (orderNumber = '') => orderNumber.slice(-8).toUpperCase()

const buildOrderSearchText = (order) => {
  const reasons = (order.billingAddress?.purchaseReasons || [])
    .map((reason) => formatPurchaseReason(reason, order.billingAddress?.purchaseReasonOther))
    .join(' ')

  const itemFields = (order.items || []).flatMap((item) => [
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
    order.id,
    order.orderNumber,
    shortOrderNumber(order.orderNumber),
    order.billingAddress?.name,
    order.billingAddress?.email,
    order.billingAddress?.phone,
    reasons,
    order.paymentMethod,
    'online',
    'online payment',
    order.paymentStatus,
    order.razorpayOrderId,
    order.razorpayPaymentId,
    order.status,
    String(order.totalAmount ?? ''),
    formatCurrency(order.totalAmount),
    formatDate(order.createdAt),
    ...itemFields,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

const matchesCustomerEmail = (order, email = '') => {
  const filterEmail = email.trim().toLowerCase()
  if (!filterEmail) return true

  return (order.billingAddress?.email || '').trim().toLowerCase() === filterEmail
}

const matchesSearch = (order, query) => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  const haystack = buildOrderSearchText(order)
  const tokens = normalized.split(/\s+/).filter(Boolean)
  return tokens.every((token) => haystack.includes(token))
}

const matchesDateRange = (order, fromDate, toDate) => {
  if (!fromDate && !toDate) return true

  const orderDate = new Date(order.createdAt)
  if (Number.isNaN(orderDate.getTime())) return false

  if (fromDate) {
    const start = new Date(`${fromDate}T00:00:00`)
    if (orderDate < start) return false
  }

  if (toDate) {
    const end = new Date(`${toDate}T23:59:59.999`)
    if (orderDate > end) return false
  }

  return true
}

const paymentStatusStyles = {
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
}

const Orders = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const tableContainerRef = useRef(null)
  const restore = location.state?.restore

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState(restore?.searchQuery || '')
  const [customerEmailFilter, setCustomerEmailFilter] = useState(restore?.customerEmail || '')
  const [paymentFilter, setPaymentFilter] = useState(restore?.paymentFilter || 'all')
  const [statusFilter, setStatusFilter] = useState(restore?.statusFilter || 'all')
  const [dateFrom, setDateFrom] = useState(restore?.dateFrom || '')
  const [dateTo, setDateTo] = useState(restore?.dateTo || '')
  const [highlightedId, setHighlightedId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchOrders()
        setOrders(response.data.data?.orders || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  useEffect(() => {
    const nextRestore = location.state?.restore
    if (!nextRestore || loading) return

    if (nextRestore.searchQuery !== undefined) setSearchQuery(nextRestore.searchQuery)
    if (nextRestore.customerEmail !== undefined) {
      setCustomerEmailFilter(nextRestore.customerEmail)
      setSearchQuery(nextRestore.customerEmail)
    }
    if (nextRestore.paymentFilter) setPaymentFilter(nextRestore.paymentFilter)
    if (nextRestore.statusFilter) setStatusFilter(nextRestore.statusFilter)
    if (nextRestore.dateFrom !== undefined) setDateFrom(nextRestore.dateFrom)
    if (nextRestore.dateTo !== undefined) setDateTo(nextRestore.dateTo)

    const frame = requestAnimationFrame(() => {
      if (tableContainerRef.current && typeof nextRestore.scrollTop === 'number') {
        tableContainerRef.current.scrollTop = nextRestore.scrollTop
      }

      if (nextRestore.orderId) {
        setHighlightedId(nextRestore.orderId)
        const row = document.getElementById(`order-row-${nextRestore.orderId}`)
        row?.scrollIntoView({ block: 'center', behavior: 'auto' })
        window.setTimeout(() => setHighlightedId(''), 2500)
      }

      navigate('/orders', { replace: true, state: {} })
    })

    return () => cancelAnimationFrame(frame)
  }, [loading, location.state, navigate])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (paymentFilter !== 'all' && order.paymentStatus !== paymentFilter) {
        return false
      }

      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false
      }

      if (!matchesDateRange(order, dateFrom, dateTo)) {
        return false
      }

      if (!matchesCustomerEmail(order, customerEmailFilter)) {
        return false
      }

      return matchesSearch(order, searchQuery)
    })
  }, [orders, paymentFilter, searchQuery, statusFilter, dateFrom, dateTo, customerEmailFilter])

  const hasActiveFilters =
    searchQuery.trim() ||
    customerEmailFilter.trim() ||
    paymentFilter !== 'all' ||
    statusFilter !== 'all' ||
    dateFrom ||
    dateTo

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredOrders.slice(start, start + PAGE_SIZE)
  }, [filteredOrders, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, customerEmailFilter, paymentFilter, statusFilter, dateFrom, dateTo])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const clearFilters = () => {
    setSearchQuery('')
    setCustomerEmailFilter('')
    setPaymentFilter('all')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="space-y-4">
      {customerEmailFilter && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Filtered by customer email: <span className="font-semibold">{customerEmailFilter}</span>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search orders
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, email, phone, order no, Razorpay ID, clip ID, license no, product..."
              className={inputClass}
            />
          </label>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Payment status
            </span>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className={inputClass}
            >
              {PAYMENT_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Order status
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={inputClass}
            >
              {STATUS_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              From date
            </span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              To date
            </span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        {!loading && (
          <p className="text-xs text-slate-500">
            Showing {filteredOrders.length} of {orders.length} orders
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
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading orders...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  {orders.length === 0
                    ? 'No orders yet.'
                    : 'No orders match your search or filters.'}
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  id={`order-row-${order.id}`}
                  className={`hover:bg-slate-50/80 ${
                    highlightedId === order.id ? 'bg-amber-50 ring-1 ring-inset ring-amber-200' : ''
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    #{shortOrderNumber(order.orderNumber)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {order.billingAddress?.name || '—'}
                    </p>
                    <p className="text-xs text-slate-500">{order.billingAddress?.email || '—'}</p>
                    <p className="text-xs text-slate-500">{order.billingAddress?.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-600">Online</p>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                        paymentStatusStyles[order.paymentStatus] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {order.paymentStatus || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                      {order.status || 'confirmed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/orders/${order.id}`}
                      state={{
                        fromList: {
                          searchQuery,
                          paymentFilter,
                          statusFilter,
                          dateFrom,
                          dateTo,
                          scrollTop: tableContainerRef.current?.scrollTop ?? 0,
                          orderId: order.id,
                        },
                      }}
                      className="font-semibold text-slate-900 hover:underline"
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

      {!loading && filteredOrders.length > 0 && (
        <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3 p-4`}>
          <p className="text-sm text-slate-600">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} of{' '}
            {filteredOrders.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AdminAlertModal
        open={Boolean(error)}
        title="Could not load orders"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default Orders
