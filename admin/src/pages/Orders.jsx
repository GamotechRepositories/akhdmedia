import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fetchAdminOrders, fetchOrders } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import OrderAmountSummary from '../components/OrderAmountSummary'
import AdminPagination from '../components/ui/AdminPagination'
import AdminTable from '../components/ui/AdminTable'
import TableLoader from '../components/ui/TableLoader'
import {
  actionViewClass,
  filterGridClass,
  inputClass,
  exportBtnClass,
  tableBodyClass,
  tableEmptyClass,
  tableHeadClass,
  tableRowClass,
  tdClass,
  tdHideLg,
  tdHideMd,
  tdPrimaryClass,
  tdRightClass,
  thClass,
  thHideLg,
  thHideMd,
  thRightClass,
} from '../components/ui/adminUi'
import { downloadOrdersExcel } from '../utils/exportOrdersExcel'
import { buildPageCacheKey, createPaginatedLoader } from '../utils/paginatedPageCache'

const PAGE_SIZE = 50
const ordersLoader = createPaginatedLoader()

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

const paymentStatusStyles = {
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
}

const Orders = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const tableContainerRef = useRef(null)
  const skipSearchResetRef = useRef(true)
  const restore = location.state?.restore

  const [orders, setOrders] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [grandTotal, setGrandTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState(restore?.searchQuery || '')
  const [debouncedSearch, setDebouncedSearch] = useState(restore?.searchQuery || '')
  const [customerEmailFilter, setCustomerEmailFilter] = useState(restore?.customerEmail || '')
  const [paymentFilter, setPaymentFilter] = useState(restore?.paymentFilter || 'all')
  const [statusFilter, setStatusFilter] = useState(restore?.statusFilter || 'all')
  const [dateFrom, setDateFrom] = useState(restore?.dateFrom || '')
  const [dateTo, setDateTo] = useState(restore?.dateTo || '')
  const [highlightedId, setHighlightedId] = useState('')
  const [currentPage, setCurrentPage] = useState(restore?.page || 1)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (skipSearchResetRef.current) {
      skipSearchResetRef.current = false
      return
    }
    setCurrentPage(1)
    ordersLoader.clear()
  }, [debouncedSearch])

  const invalidateAndResetPage = () => {
    ordersLoader.clear()
    setCurrentPage(1)
  }

  const loadOrders = useCallback(
    async ({ force = false } = {}) => {
      const cacheKey = buildPageCacheKey('orders', currentPage, {
        search: debouncedSearch,
        paymentStatus: paymentFilter,
        status: statusFilter,
        customerEmail: customerEmailFilter,
        dateFrom,
        dateTo,
      })

      setLoading(true)
      setError('')

      try {
        const result = await ordersLoader.load({
          cacheKey,
          force,
          fetchPage: async () => {
            const response = await fetchAdminOrders({
              page: currentPage,
              limit: PAGE_SIZE,
              search: debouncedSearch,
              paymentStatus: paymentFilter,
              status: statusFilter,
              customerEmail: customerEmailFilter,
              dateFrom,
              dateTo,
            })
            const payload = response.data?.data || {}
            return {
              items: payload.orders || [],
              totalCount: payload.pagination?.total || 0,
              totalPages: payload.pagination?.totalPages || 1,
              grandTotal: payload.meta?.grandTotal ?? payload.pagination?.total ?? 0,
            }
          },
        })

        setOrders(result.items)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
        setGrandTotal(result.grandTotal)
      } catch (err) {
        setError(err.message)
        setOrders([])
        setTotalCount(0)
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    },
    [
      currentPage,
      debouncedSearch,
      paymentFilter,
      statusFilter,
      customerEmailFilter,
      dateFrom,
      dateTo,
    ],
  )

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    const nextRestore = location.state?.restore
    if (!nextRestore) return

    ordersLoader.clear()

    if (nextRestore.searchQuery !== undefined) {
      setSearchQuery(nextRestore.searchQuery)
      setDebouncedSearch(nextRestore.searchQuery)
    }
    if (nextRestore.customerEmail !== undefined) {
      setCustomerEmailFilter(nextRestore.customerEmail)
      setSearchQuery(nextRestore.customerEmail)
      setDebouncedSearch(nextRestore.customerEmail)
    }
    if (nextRestore.paymentFilter) setPaymentFilter(nextRestore.paymentFilter)
    if (nextRestore.statusFilter) setStatusFilter(nextRestore.statusFilter)
    if (nextRestore.dateFrom !== undefined) setDateFrom(nextRestore.dateFrom)
    if (nextRestore.dateTo !== undefined) setDateTo(nextRestore.dateTo)
    if (nextRestore.page) setCurrentPage(nextRestore.page)

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
  }, [location.state, navigate])

  const hasActiveFilters =
    searchQuery.trim() ||
    customerEmailFilter.trim() ||
    paymentFilter !== 'all' ||
    statusFilter !== 'all' ||
    dateFrom ||
    dateTo

  const clearFilters = () => {
    ordersLoader.clear()
    setSearchQuery('')
    setDebouncedSearch('')
    setCustomerEmailFilter('')
    setPaymentFilter('all')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
    setCurrentPage(1)
  }

  const handleExportExcel = async () => {
    setExporting(true)
    setError('')
    try {
      const response = await fetchOrders()
      const allOrders = response.data?.data?.orders || []
      if (!allOrders.length) {
        setError('No orders to export')
        return
      }
      downloadOrdersExcel(allOrders, { scope: 'all' })
    } catch (exportError) {
      setError(exportError.message || 'Could not export orders')
    } finally {
      setExporting(false)
    }
  }

  const listStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const listEnd = Math.min(currentPage * PAGE_SIZE, totalCount)

  return (
    <div className="space-y-4">
      {customerEmailFilter && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Filtered by customer email: <span className="font-semibold">{customerEmailFilter}</span>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={loading || exporting || grandTotal === 0}
              className={`${exportBtnClass} shrink-0`}
            >
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {exporting ? 'Exporting...' : 'Download Excel'}
              </span>
            </button>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        <div className={filterGridClass}>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Payment status
            </span>
            <select
              value={paymentFilter}
              onChange={(e) => {
                invalidateAndResetPage()
                setPaymentFilter(e.target.value)
              }}
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
              onChange={(e) => {
                invalidateAndResetPage()
                setStatusFilter(e.target.value)
              }}
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
              onChange={(e) => {
                invalidateAndResetPage()
                setDateFrom(e.target.value)
              }}
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
              onChange={(e) => {
                invalidateAndResetPage()
                setDateTo(e.target.value)
              }}
              className={inputClass}
            />
          </label>
        </div>

        {!loading && (
          <p className="text-xs text-slate-500">
            {totalCount === 0
              ? 'No orders match your search or filters.'
              : `Showing ${listStart}-${listEnd} of ${totalCount} orders`}
          </p>
        )}
      </div>

      <AdminTable ref={tableContainerRef} maxHeight className="min-h-[240px]">
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>Order</th>
            <th className={thClass}>Customer</th>
            <th className={thClass}>Total</th>
            <th className={thHideMd}>Payment</th>
            <th className={thHideLg}>Status</th>
            <th className={thHideLg}>Date</th>
            <th className={thRightClass}>Actions</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading ? (
            <TableLoader label="Loading orders..." colSpan={7} className={tableEmptyClass} />
          ) : orders.length === 0 ? (
            <tr>
              <td colSpan={7} className={tableEmptyClass}>
                {hasActiveFilters ? 'No orders match your search or filters.' : 'No orders yet.'}
              </td>
            </tr>
          ) : (
            orders.map((order) => (
              <tr
                key={order.id}
                id={`order-row-${order.id}`}
                className={`${tableRowClass} ${
                  highlightedId === order.id ? 'bg-amber-50 ring-1 ring-inset ring-amber-200' : ''
                }`}
              >
                <td className={tdPrimaryClass}>#{shortOrderNumber(order.orderNumber)}</td>
                <td className={tdClass}>
                  <p className="font-medium text-slate-900">{order.billingAddress?.name || '—'}</p>
                  <p className="text-xs text-slate-500">{order.billingAddress?.email || '—'}</p>
                  <p className="text-xs text-slate-500">{order.billingAddress?.phone || '—'}</p>
                </td>
                <td className={tdClass}>
                  <OrderAmountSummary order={order} compact />
                </td>
                <td className={tdHideMd}>
                  <p className="text-slate-600">Online</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                      paymentStatusStyles[order.paymentStatus] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {order.paymentStatus || '—'}
                  </span>
                </td>
                <td className={tdHideLg}>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                    {order.status || 'confirmed'}
                  </span>
                </td>
                <td className={`${tdHideLg} text-slate-600`}>{formatDate(order.createdAt)}</td>
                <td className={tdRightClass}>
                  <Link
                    to={`/orders/${order.id}`}
                    state={{
                      fromList: {
                        searchQuery,
                        customerEmail: customerEmailFilter,
                        paymentFilter,
                        statusFilter,
                        dateFrom,
                        dateTo,
                        page: currentPage,
                        scrollTop: tableContainerRef.current?.scrollTop ?? 0,
                        orderId: order.id,
                      },
                    }}
                    className={actionViewClass}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>

      {!loading && totalCount > 0 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
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
