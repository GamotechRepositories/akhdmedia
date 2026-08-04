import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
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
  tdHideLg,
  tdHideMd,
  tdHideSm,
  tdPrimaryClass,
  thClass,
  thHideLg,
  thHideMd,
  thHideSm,
} from '../components/ui/adminUi'
import {
  buildDailyRows,
  filterTransactionsByMonth,
  formatCurrency,
  parseMonthKey,
} from '../utils/revenueHelpers'

const DAY_PAGE_SIZE = 50

const RevenueMonthDetail = () => {
  const navigate = useNavigate()
  const { monthKey } = useParams()
  const monthMeta = useMemo(() => parseMonthKey(monthKey), [monthKey])

  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [dayPage, setDayPage] = useState(1)

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

  const monthTransactions = useMemo(
    () => (monthMeta ? filterTransactionsByMonth(transactions, monthMeta.key) : []),
    [transactions, monthMeta],
  )

  const monthSummary = useMemo(() => {
    if (!monthMeta) return null

    const summary = {
      ...monthMeta,
      totalRevenue: 0,
      totalTransactions: 0,
      paidTransactions: 0,
      failedTransactions: 0,
      pendingTransactions: 0,
    }

    for (const txn of monthTransactions) {
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
  }, [monthMeta, monthTransactions])

  const dailyRows = useMemo(() => buildDailyRows(monthTransactions), [monthTransactions])

  const dayTotalPages = Math.max(1, Math.ceil(dailyRows.length / DAY_PAGE_SIZE))
  const paginatedDailyRows = useMemo(() => {
    const start = (dayPage - 1) * DAY_PAGE_SIZE
    return dailyRows.slice(start, start + DAY_PAGE_SIZE)
  }, [dailyRows, dayPage])

  useEffect(() => {
    setDayPage(1)
  }, [monthKey])

  useEffect(() => {
    if (dayPage > dayTotalPages) setDayPage(dayTotalPages)
  }, [dayPage, dayTotalPages])

  if (!monthMeta) {
    return <Navigate to="/revenue" replace />
  }

  return (
    <div className="space-y-4">
      <div className={`${cardClass} p-3 sm:p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Month report
            </p>
            <h2 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              {monthMeta.label}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Day-wise orders for this month. Click a day to open the full report.
            </p>
          </div>
          <Link to="/revenue" className={secondaryBtnClass}>
            ← Back to Revenue
          </Link>
        </div>
      </div>

      <div className={statGridClass}>
        <div className={`${cardClass} p-4 sm:p-5`}>
          <p className="text-sm text-slate-500">Month revenue</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 sm:text-3xl">
            {loading ? '—' : formatCurrency(monthSummary?.totalRevenue)}
          </p>
        </div>
        <div className={`${cardClass} p-4 sm:p-5`}>
          <p className="text-sm text-slate-500">Paid orders</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {loading ? '—' : monthSummary?.paidTransactions}
          </p>
        </div>
        <div className={`${cardClass} p-4 sm:p-5`}>
          <p className="text-sm text-slate-500">All orders</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {loading ? '—' : monthSummary?.totalTransactions}
          </p>
        </div>
        <div className={`${cardClass} p-4 sm:p-5 sm:col-span-2 xl:col-span-1`}>
          <p className="text-sm text-slate-500">Active days</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            {loading ? '—' : dailyRows.length}
          </p>
        </div>
      </div>

      <AdminTable wide maxHeight>
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>Day</th>
            <th className={thClass}>Revenue</th>
            <th className={thHideSm}>Paid</th>
            <th className={thHideMd}>Failed</th>
            <th className={thHideMd}>Pending</th>
            <th className={thHideSm}>All orders</th>
            <th className={thHideLg}>Avg paid</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading ? (
            <TableLoader label="Loading day-wise report..." colSpan={7} className={tableEmptyClass} />
          ) : dailyRows.length === 0 ? (
            <tr>
              <td colSpan={7} className={tableEmptyClass}>
                No day-wise data for this month.
              </td>
            </tr>
          ) : (
            paginatedDailyRows.map((row) => (
              <tr
                key={row.key}
                role="link"
                tabIndex={0}
                onClick={() => navigate(`/revenue/${monthKey}/${row.key}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/revenue/${monthKey}/${row.key}`)
                  }
                }}
                className={`${tableRowClass} cursor-pointer`}
              >
                <td className={tdPrimaryClass}>{row.label}</td>
                <td className={`${tdClass} font-semibold text-emerald-700`}>
                  {formatCurrency(row.totalRevenue)}
                </td>
                <td className={tdHideSm}>{row.paidTransactions}</td>
                <td className={tdHideMd}>{row.failedTransactions}</td>
                <td className={tdHideMd}>{row.pendingTransactions}</td>
                <td className={tdHideSm}>{row.totalTransactions}</td>
                <td className={`${tdHideLg} text-slate-700`}>
                  {formatCurrency(row.avgOrderValue)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>

      {!loading && dailyRows.length > 0 && (
        <AdminPagination
          currentPage={dayPage}
          totalPages={dayTotalPages}
          totalItems={dailyRows.length}
          pageSize={DAY_PAGE_SIZE}
          onPageChange={setDayPage}
        />
      )}

      <AdminAlertModal
        open={Boolean(error)}
        title="Could not load month report"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default RevenueMonthDetail
