import { useEffect, useMemo, useState } from 'react'
import { fetchTransactions } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import { cardClass, inputClass } from '../components/ui/adminUi'

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
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revenue tracking</p>
            <p className="mt-1 text-sm text-slate-600">Monthly revenue record from successful payments.</p>
          </div>
          <label className="block sm:w-52">
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`${cardClass} p-5`}>
          <p className="text-sm text-slate-500">Total revenue</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{formatCurrency(totals.revenue)}</p>
        </div>
        <div className={`${cardClass} p-5`}>
          <p className="text-sm text-slate-500">Paid transactions</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totals.paidTransactions}</p>
        </div>
        <div className={`${cardClass} p-5`}>
          <p className="text-sm text-slate-500">All transactions</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{totals.totalTransactions}</p>
        </div>
        <div className={`${cardClass} p-5`}>
          <p className="text-sm text-slate-500">Months tracked</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{monthlyRows.length}</p>
        </div>
      </div>

      <div className={`${cardClass} max-h-[70vh] overflow-auto`}>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Month</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Failed</th>
              <th className="px-4 py-3">Pending</th>
              <th className="px-4 py-3">All txns</th>
              <th className="px-4 py-3">Avg paid value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading monthly revenue...
                </td>
              </tr>
            ) : monthlyRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No revenue data found.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr key={row.key} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.label}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(row.totalRevenue)}</td>
                  <td className="px-4 py-3 text-slate-700">{row.paidTransactions}</td>
                  <td className="px-4 py-3 text-slate-700">{row.failedTransactions}</td>
                  <td className="px-4 py-3 text-slate-700">{row.pendingTransactions}</td>
                  <td className="px-4 py-3 text-slate-700">{row.totalTransactions}</td>
                  <td className="px-4 py-3 text-slate-700">{formatCurrency(row.avgOrderValue)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && monthlyRows.length > 0 && (
        <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3 p-4`}>
          <p className="text-sm text-slate-600">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, monthlyRows.length)} of{' '}
            {monthlyRows.length} entries
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
        title="Could not load revenue"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default Revenue
