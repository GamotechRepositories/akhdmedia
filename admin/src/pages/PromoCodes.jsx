import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deletePromoCode, fetchPromoCodes } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import StatusBadge from '../components/StatusBadge'
import { primaryBtnClass, tableWrapClass } from '../components/ui/adminUi'

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const PAGE_SIZE = 50

const formatDiscount = (promo) =>
  promo.discountType === 'percentage'
    ? `${promo.discountValue}%`
    : formatCurrency(promo.discountValue)

const formatExpiry = (value) => {
  if (!value) return 'No expiry'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No expiry'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const PromoCodes = () => {
  const [promoCodes, setPromoCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const loadPromoCodes = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetchPromoCodes()
      setPromoCodes(response.data.data.promoCodes)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPromoCodes()
  }, [])

  const handleDelete = async (promo) => {
    if (!window.confirm(`Delete promo code "${promo.code}"?`)) return

    try {
      await deletePromoCode(promo.id)
      await loadPromoCodes()
    } catch (err) {
      window.alert(err.message)
    }
  }

  const totalPages = Math.max(1, Math.ceil(promoCodes.length / PAGE_SIZE))
  const paginatedPromoCodes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return promoCodes.slice(start, start + PAGE_SIZE)
  }, [promoCodes, currentPage])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Marketing</p>
          <h1 className="text-2xl font-bold text-slate-900">Promo Codes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage discount codes customers apply on the cart page.
          </p>
        </div>
        <Link to="/promo-codes/new" className={primaryBtnClass}>
          Add Promo Code
        </Link>
      </div>

      <div className={tableWrapClass}>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Min order</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  Loading promo codes...
                </td>
              </tr>
            ) : promoCodes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No promo codes yet. Create one for customers to use at checkout.
                </td>
              </tr>
            ) : (
              paginatedPromoCodes.map((promo) => (
                <tr key={promo.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{promo.code}</p>
                    {promo.description ? (
                      <p className="mt-0.5 text-xs text-slate-500">{promo.description}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDiscount(promo)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {promo.minOrderAmount > 0 ? formatCurrency(promo.minOrderAmount) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <p>
                      {promo.usedCount}
                      {promo.maxUses != null ? ` / ${promo.maxUses}` : ''} total
                    </p>
                    {promo.maxUsesPerUser != null ? (
                      <p className="mt-0.5 text-xs text-slate-500">{promo.maxUsesPerUser} per customer</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatExpiry(promo.expiresAt)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge active={promo.isActive} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/promo-codes/${promo.id}/edit`}
                      className="mr-3 font-semibold text-slate-900 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(promo)}
                      className="font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && promoCodes.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, promoCodes.length)} of {promoCodes.length} entries
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
        title="Could not load promo codes"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default PromoCodes
