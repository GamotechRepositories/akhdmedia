import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { fetchAdminTransactions } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import AdminPagination from '../components/ui/AdminPagination'
import AdminTable from '../components/ui/AdminTable'
import {
  actionViewClass,
  cardClass,
  inputClass,
  tableBodyClass,
  tableEmptyClass,
  tableHeadClass,
  tableRowClass,
  tdClass,
  tdHideMd,
  tdPrimaryClass,
  tdRightClass,
  thClass,
  thHideMd,
  thRightClass,
} from '../components/ui/adminUi'
import { buildPageCacheKey, createPaginatedLoader } from '../utils/paginatedPageCache'

const PAGE_SIZE = 50
const transactionsLoader = createPaginatedLoader()

const PURCHASE_REASON_LABELS = {
  personal: 'Personal collection',
  digital: 'Digital media',
  outlet: 'Outlet media',
  other: 'Other',
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

const Transactions = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const tableContainerRef = useRef(null)
  const skipSearchResetRef = useRef(true)

  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState(location.state?.restore?.filter || 'all')
  const [searchQuery, setSearchQuery] = useState(location.state?.restore?.searchQuery || '')
  const [debouncedSearch, setDebouncedSearch] = useState(location.state?.restore?.searchQuery || '')
  const [highlightedId, setHighlightedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(location.state?.restore?.page || 1)

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
    transactionsLoader.clear()
  }, [debouncedSearch])

  const loadTransactions = useCallback(
    async ({ force = false } = {}) => {
      const cacheKey = buildPageCacheKey('transactions', currentPage, {
        search: debouncedSearch,
        status: filter,
      })

      setLoading(true)
      setError('')

      try {
        const result = await transactionsLoader.load({
          cacheKey,
          force,
          fetchPage: async () => {
            const response = await fetchAdminTransactions({
              page: currentPage,
              limit: PAGE_SIZE,
              search: debouncedSearch,
              status: filter,
            })
            const payload = response.data?.data || {}
            return {
              items: payload.transactions || [],
              totalCount: payload.pagination?.total || 0,
              totalPages: payload.pagination?.totalPages || 1,
              summary: payload.summary || null,
            }
          },
        })

        setTransactions(result.items)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
        if (result.summary) setSummary(result.summary)
      } catch (err) {
        setError(err.message)
        setTransactions([])
        setTotalCount(0)
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    },
    [currentPage, debouncedSearch, filter],
  )

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  useEffect(() => {
    const restore = location.state?.restore
    if (!restore) return

    transactionsLoader.clear()

    if (restore.filter) setFilter(restore.filter)
    if (restore.searchQuery !== undefined) {
      setSearchQuery(restore.searchQuery)
      setDebouncedSearch(restore.searchQuery)
    }
    if (restore.page) setCurrentPage(restore.page)

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
  }, [location.state, navigate])

  const listStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const listEnd = Math.min(currentPage * PAGE_SIZE, totalCount)

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className={`${cardClass} p-3`}>
            <p className="text-xs text-slate-500">Total transactions</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{summary.total}</p>
          </div>
          <div className={`${cardClass} p-3`}>
            <p className="text-xs text-slate-500">Successful</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{summary.successful}</p>
            <p className="mt-1 text-xs text-slate-400">Paid online only</p>
          </div>
          <div className={`${cardClass} p-3`}>
            <p className="text-xs text-slate-500">Failed</p>
            <p className="mt-1 text-2xl font-bold text-red-600">{summary.failed}</p>
          </div>
          <div className={`${cardClass} p-3`}>
            <p className="text-xs text-slate-500">Pending</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">{summary.pending}</p>
          </div>
          <div className={`${cardClass} p-3`}>
            <p className="text-xs text-slate-500">Successful amount</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {formatCurrency(summary.successfulAmount)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Razorpay paid</p>
          </div>
          <div className={`${cardClass} p-3`}>
            <p className="text-xs text-slate-500">Revenue</p>
            <p className="mt-1 text-xl font-bold text-violet-600">
              {formatCurrency(summary.revenue ?? 0)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Paid online</p>
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-4">
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
              onClick={() => {
                transactionsLoader.clear()
                setFilter(item.id)
                setCurrentPage(1)
              }}
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
            {totalCount === 0
              ? 'No transactions match your search or filters.'
              : `Showing ${listStart}-${listEnd} of ${totalCount} transactions`}
          </p>
        )}
      </div>

      <AdminTable ref={tableContainerRef} maxHeight className="min-h-[240px]">
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>Date</th>
            <th className={thClass}>Customer</th>
            <th className={thHideMd}>Items</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Amount</th>
            <th className={thRightClass}>View</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading ? (
            <tr>
              <td colSpan={6} className={tableEmptyClass}>
                Loading transactions...
              </td>
            </tr>
          ) : transactions.length === 0 ? (
            <tr>
              <td colSpan={6} className={tableEmptyClass}>
                No transactions match your search or filters.
              </td>
            </tr>
          ) : (
            transactions.map((txn) => (
              <tr
                key={txn.id}
                id={`txn-row-${txn.id}`}
                className={`${tableRowClass} ${
                  highlightedId === txn.id ? 'bg-amber-50 ring-1 ring-inset ring-amber-200' : ''
                }`}
              >
                <td className={`${tdClass} whitespace-nowrap text-slate-600`}>
                  {formatDate(txn.createdAt)}
                </td>
                <td className={tdClass}>
                  <p className="font-medium text-slate-900">{txn.customerName || '—'}</p>
                  <p className="break-all text-xs text-slate-500">{txn.customerEmail || '—'}</p>
                </td>
                <td className={tdHideMd}>
                  {txn.itemCount || txn.items?.length || 0} item
                  {(txn.itemCount || txn.items?.length || 0) === 1 ? '' : 's'}
                </td>
                <td className={tdClass}>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      statusStyles[txn.transactionStatus] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {txn.transactionStatusLabel}
                  </span>
                </td>
                <td className={`${tdPrimaryClass} whitespace-nowrap`}>{formatCurrency(txn.amount)}</td>
                <td className={tdRightClass}>
                  <Link
                    to={`/transactions/${txn.id}`}
                    state={{
                      fromList: {
                        filter,
                        searchQuery,
                        page: currentPage,
                        scrollTop: tableContainerRef.current?.scrollTop ?? 0,
                        transactionId: txn.id,
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
        title="Could not load transactions"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default Transactions
