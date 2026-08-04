import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { fetchTransactions } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import AdminPagination from '../components/ui/AdminPagination'
import AdminTable from '../components/ui/AdminTable'
import TableLoader from '../components/ui/TableLoader'
import {
  cardClass,
  secondaryBtnClass,
  statGridClass,
  tableBodyClass,
  tableEmptyClass,
  tableHeadClass,
  tableRowClass,
  tdClass,
  tdHideMd,
  tdHideSm,
  tdPrimaryClass,
  thClass,
  thHideMd,
  thHideSm,
} from '../components/ui/adminUi'
import {
  filterTransactionsByDay,
  formatCurrency,
  formatDateTime,
  parseDayKey,
  parseMonthKey,
  statusStyles,
} from '../utils/revenueHelpers'

const PAGE_SIZE = 50

const RevenueDayDetail = () => {
  const { monthKey, dayKey } = useParams()
  const monthMeta = useMemo(() => parseMonthKey(monthKey), [monthKey])
  const dayMeta = useMemo(() => parseDayKey(dayKey), [dayKey])

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchTransactions()
        setTransactions(response.data.data?.transactions || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [])

  const dayTransactions = useMemo(
    () => (dayMeta ? filterTransactionsByDay(transactions, dayMeta.key) : []),
    [transactions, dayMeta],
  )

  const daySummary = useMemo(() => {
    if (!dayMeta) return null

    const summary = {
      ...dayMeta,
      totalRevenue: 0,
      totalTransactions: 0,
      paidTransactions: 0,
      failedTransactions: 0,
      pendingTransactions: 0,
    }

    for (const txn of dayTransactions) {
      summary.totalTransactions += 1
      if (txn.transactionStatus === 'successful') {
        summary.paidTransactions += 1
        summary.totalRevenue += Number(txn.amount) || 0
      } else if (txn.transactionStatus === 'failed') {
        summary.failedTransactions += 1
      } else {
        summary.pendingTransactions += 1
      }
    }

    summary.avgOrderValue = summary.paidTransactions
      ? summary.totalRevenue / summary.paidTransactions
      : 0

    return summary
  }, [dayMeta, dayTransactions])

  const totalPages = Math.max(1, Math.ceil(dayTransactions.length / PAGE_SIZE))
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return dayTransactions.slice(start, start + PAGE_SIZE)
  }, [dayTransactions, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [dayKey])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  if (!monthMeta || !dayMeta || dayMeta.monthKey !== monthMeta.key) {
    return <Navigate to={monthMeta ? `/revenue/${monthMeta.key}` : '/revenue'} replace />
  }

  return (
    <div className="space-y-4">
      <div className={`${cardClass} p-3 sm:p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Day report · {monthMeta.label}
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              {dayMeta.label}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              All orders and revenue detail for this day.
            </p>
          </div>
          <Link to={`/revenue/${monthKey}`} className={secondaryBtnClass}>
            ← Back to {monthMeta.label}
          </Link>
        </div>
      </div>

      <div className={statGridClass}>
        <div className={`${cardClass} p-4 sm:p-5`}>
          <p className="text-sm text-slate-500">Day revenue</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 sm:text-3xl">
            {loading ? '—' : formatCurrency(daySummary?.totalRevenue)}
          </p>
        </div>
        <div className={`${cardClass} p-4 sm:p-5`}>
          <p className="text-sm text-slate-500">Paid orders</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {loading ? '—' : daySummary?.paidTransactions}
          </p>
        </div>
        <div className={`${cardClass} p-4 sm:p-5`}>
          <p className="text-sm text-slate-500">All orders</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {loading ? '—' : daySummary?.totalTransactions}
          </p>
        </div>
        <div className={`${cardClass} p-4 sm:p-5 sm:col-span-2 xl:col-span-1`}>
          <p className="text-sm text-slate-500">Avg paid</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {loading ? '—' : formatCurrency(daySummary?.avgOrderValue)}
          </p>
        </div>
      </div>

      <div className={`${cardClass} p-3 sm:p-4`}>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Order details
        </p>
        <p className="mt-1 text-sm text-slate-600">
          {loading
            ? 'Loading orders...'
            : `${dayTransactions.length} order${dayTransactions.length === 1 ? '' : 's'} on ${dayMeta.label}.`}
        </p>
      </div>

      <AdminTable wide maxHeight>
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>Time</th>
            <th className={thClass}>Order</th>
            <th className={thHideSm}>Customer</th>
            <th className={thHideMd}>Items</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Amount</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading ? (
            <TableLoader label="Loading orders..." colSpan={6} className={tableEmptyClass} />
          ) : dayTransactions.length === 0 ? (
            <tr>
              <td colSpan={6} className={tableEmptyClass}>
                No orders found for this day.
              </td>
            </tr>
          ) : (
            paginatedRows.map((txn) => (
              <tr key={txn.id} className={tableRowClass}>
                <td className={`${tdClass} whitespace-nowrap`}>{formatDateTime(txn.createdAt)}</td>
                <td className={tdPrimaryClass}>
                  <Link
                    to={`/transactions/${txn.id}`}
                    className="font-semibold text-slate-900 underline-offset-2 hover:underline"
                  >
                    {txn.orderNumber || txn.transactionId || txn.id}
                  </Link>
                </td>
                <td className={tdHideSm}>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {txn.customerName || '—'}
                    </p>
                    <p className="truncate text-xs text-slate-500">{txn.customerEmail || ''}</p>
                  </div>
                </td>
                <td className={tdHideMd}>{txn.itemCount || txn.items?.length || 0}</td>
                <td className={tdClass}>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      statusStyles[txn.transactionStatus] || 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {txn.transactionStatusLabel || txn.transactionStatus}
                  </span>
                </td>
                <td className={`${tdPrimaryClass} whitespace-nowrap`}>
                  {formatCurrency(txn.amount)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>

      {!loading && dayTransactions.length > 0 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={dayTransactions.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}

      <AdminAlertModal
        open={Boolean(error)}
        title="Could not load day report"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default RevenueDayDetail
