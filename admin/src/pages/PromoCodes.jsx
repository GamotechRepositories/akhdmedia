import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deletePromoCode, fetchPromoCodes } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import StatusBadge from '../components/StatusBadge'
import AdminPageHeader from '../components/ui/AdminPageHeader'
import AdminPagination from '../components/ui/AdminPagination'
import AdminTable from '../components/ui/AdminTable'
import {
  actionDeleteClass,
  actionEditClass,
  actionGroupClass,
  primaryBtnClass,
  tableBodyClass,
  tableEmptyClass,
  tableHeadClass,
  tableRowClass,
  tdClass,
  tdHideMd,
  tdHideSm,
  tdPrimaryClass,
  tdRightClass,
  thClass,
  thHideMd,
  thHideSm,
  thRightClass,
} from '../components/ui/adminUi'

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
      <AdminPageHeader
        eyebrow="Marketing"
        title="Promo Codes"
        description="Manage discount codes customers apply on the cart page."
        action={
          <Link to="/promo-codes/new" className={primaryBtnClass}>
            Add Promo Code
          </Link>
        }
      />

      <AdminTable wide>
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>Code</th>
            <th className={thClass}>Discount</th>
            <th className={thHideSm}>Min order</th>
            <th className={thHideMd}>Usage</th>
            <th className={thHideSm}>Expires</th>
            <th className={thClass}>Status</th>
            <th className={thRightClass}>Actions</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading ? (
            <tr>
              <td colSpan={7} className={tableEmptyClass}>
                Loading promo codes...
              </td>
            </tr>
          ) : promoCodes.length === 0 ? (
            <tr>
              <td colSpan={7} className={tableEmptyClass}>
                No promo codes yet. Create one for customers to use at checkout.
              </td>
            </tr>
          ) : (
            paginatedPromoCodes.map((promo) => (
              <tr key={promo.id} className={tableRowClass}>
                <td className={tdPrimaryClass}>
                  <p className="font-semibold">{promo.code}</p>
                  {promo.description ? (
                    <p className="mt-0.5 text-xs text-slate-500">{promo.description}</p>
                  ) : null}
                </td>
                <td className={tdClass}>{formatDiscount(promo)}</td>
                <td className={tdHideSm}>
                  {promo.minOrderAmount > 0 ? formatCurrency(promo.minOrderAmount) : '—'}
                </td>
                <td className={tdHideMd}>
                  <p>
                    {promo.usedCount}
                    {promo.maxUses != null ? ` / ${promo.maxUses}` : ''} total
                  </p>
                  {promo.maxUsesPerUser != null ? (
                    <p className="mt-0.5 text-xs text-slate-500">{promo.maxUsesPerUser} per customer</p>
                  ) : null}
                </td>
                <td className={tdHideSm}>{formatExpiry(promo.expiresAt)}</td>
                <td className={tdClass}>
                  <StatusBadge active={promo.isActive} />
                </td>
                <td className={tdRightClass}>
                  <div className={actionGroupClass}>
                    <Link to={`/promo-codes/${promo.id}/edit`} className={actionEditClass}>
                      Edit
                    </Link>
                    <button type="button" onClick={() => handleDelete(promo)} className={actionDeleteClass}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>

      {!loading && promoCodes.length > 0 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={promoCodes.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
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
