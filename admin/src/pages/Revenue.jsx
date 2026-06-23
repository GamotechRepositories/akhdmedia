import { useEffect, useMemo, useState } from 'react'
import { fetchTransactions } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import AdminPagination from '../components/ui/AdminPagination'
import AdminTable from '../components/ui/AdminTable'
import TableLoader from '../components/ui/TableLoader'
import {
  cardClass,
  inputClass,
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

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PAGE_SIZE = 50

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const Revenue = () => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedYear, setSelectedYear] = useState('all')
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

  const yearOptions = useMemo(() => {
    const years = new Set()
    for (const txn of transactions) {
      if (!txn.createdAt) continue
      const date = new Date(txn.createdAt)
      if (!Number.isNaN(date.getTime())) {
        years.add(String(date.getFullYear()))
      }
    }
    return Array.from(years).sort((a, b) => Number(b) - Number(a))
  }, [transactions])

  const monthlyRows = useMemo(() => {
    const buckets = new Map()

    for (const txn of transactions) {
      if (!txn.createdAt) continue
      const date = new Date(txn.createdAt)
      if (Number.isNaN(date.getTime())) continue

      const year = String(date.getFullYear())
      if (selectedYear !== 'all' && year !== selectedYear) continue

      const month = date.getMonth()
      const key = `${year}-${String(month + 1).padStart(2, '0')}`

      if (!buckets.has(key)) {
        buckets.set(key, {
          key,
          year,
          month,
          label: `${MONTH_LABELS[month]} ${year}`,
          totalRevenue: 0,
          totalTransactions: 0,
          paidTransactions: 0,
          failedTransactions: 0,
          pendingTransactions: 0,
        })
      }

      const bucket = buckets.get(key)
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

    return Array.from(buckets.values())
      .sort((a, b) => b.key.localeCompare(a.key))
      .map((row) => ({
        ...row,
        avgOrderValue: row.paidTransactions ? row.totalRevenue / row.paidTransactions : 0,
      }))
  }, [transactions, selectedYear])

  const totals = useMemo(() => {
    return monthlyRows.reduce(
      (acc, row) => {
        acc.revenue += row.totalRevenue
        acc.totalTransactions += row.totalTransactions
        acc.paidTransactions += row.paidTransactions
        return acc
      },
      { revenue: 0, totalTransactions: 0, paidTransactions: 0 },
    )
  }, [monthlyRows])

  const totalPages = Math.max(1, Math.ceil(monthlyRows.length / PAGE_SIZE))

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return monthlyRows.slice(start, start + PAGE_SIZE)
  }, [monthlyRows, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedYear])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  return (
    <div className="space-y-4">
      <div className={`${cardClass} p-3 sm:p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revenue tracking</p>
            <p className="mt-1 text-sm text-slate-600">Monthly revenue record from successful payments.</p>
          </div>
          <label className="block w-full sm:w-52">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Year</span>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              className={inputClass}
            >
              <option value="all">All years</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={statGridClass}>
        <div className={`${cardClass} p-4 sm:p-5`}>
          <p className="text-sm text-slate-500">Total revenue</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 sm:text-3xl">{formatCurrency(totals.revenue)}</p>
        </div>
        <div className={`${cardClass} p-4 sm:p-5`}>
          <p className="text-sm text-slate-500">Paid transactions</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{totals.paidTransactions}</p>
        </div>
        <div className={`${cardClass} p-4 sm:p-5`}>
          <p className="text-sm text-slate-500">All transactions</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{totals.totalTransactions}</p>
        </div>
        <div className={`${cardClass} p-4 sm:p-5 sm:col-span-2 xl:col-span-1`}>
          <p className="text-sm text-slate-500">Months tracked</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{monthlyRows.length}</p>
        </div>
      </div>

      <AdminTable wide maxHeight>
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>Month</th>
            <th className={thClass}>Revenue</th>
            <th className={thHideSm}>Paid</th>
            <th className={thHideMd}>Failed</th>
            <th className={thHideMd}>Pending</th>
            <th className={thHideSm}>All txns</th>
            <th className={thHideLg}>Avg paid</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading ? (
            <TableLoader label="Loading monthly revenue..." colSpan={7} className={tableEmptyClass} />
          ) : monthlyRows.length === 0 ? (
            <tr>
              <td colSpan={7} className={tableEmptyClass}>
                No revenue data found.
              </td>
            </tr>
          ) : (
            paginatedRows.map((row) => (
              <tr key={row.key} className={tableRowClass}>
                <td className={tdPrimaryClass}>{row.label}</td>
                <td className={`${tdClass} font-semibold text-emerald-700`}>
                  {formatCurrency(row.totalRevenue)}
                </td>
                <td className={tdHideSm}>{row.paidTransactions}</td>
                <td className={tdHideMd}>{row.failedTransactions}</td>
                <td className={tdHideMd}>{row.pendingTransactions}</td>
                <td className={tdHideSm}>{row.totalTransactions}</td>
                <td className={`${tdHideLg} text-slate-700`}>{formatCurrency(row.avgOrderValue)}</td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>

      {!loading && monthlyRows.length > 0 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={monthlyRows.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}

      <AdminAlertModal
        open={Boolean(error)}
        title="Could not load revenue"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default Revenue
