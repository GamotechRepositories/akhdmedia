import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { fetchTransaction } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import OrderAmountSummary from '../components/OrderAmountSummary'
import { getOrderLineAmountBreakdown } from '../utils/orderAmounts'
import PageLoader from '../components/ui/PageLoader'
import FormStep from '../components/FormStep'
import { compactFormClass, inputClass, secondaryBtnClass } from '../components/ui/adminUi'

const PURCHASE_REASON_LABELS = {
  personal: 'Personal collection',
  digital: 'Digital media',
  outlet: 'Media agency',
  other: 'Other',
}

const formatPurchaseReason = (reason, otherText = '') => {
  if (reason === 'other' && otherText.trim()) {
    return `Other: ${otherText.trim()}`
  }
  return PURCHASE_REASON_LABELS[reason] || reason
}

const statusStyles = {
  successful: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
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

const ReadOnlyField = ({ label, value }) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
    <div className={`${inputClass} mt-0 cursor-default bg-white text-slate-900`}>{value || '—'}</div>
  </div>
)

const TransactionDetail = () => {
  const { id } = useParams()
  const location = useLocation()
  const backState = location.state?.fromList
    ? { restore: location.state.fromList }
    : undefined
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errorDismissed, setErrorDismissed] = useState(false)

  useEffect(() => {
    const loadTransaction = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchTransaction(id)
        setTransaction(response.data.data?.transaction || null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadTransaction()
  }, [id])

  useEffect(() => {
    setErrorDismissed(false)
  }, [id])

  if (loading) {
    return <PageLoader label="Loading transaction..." />
  }

  if (error || !transaction) {
    const failureMessage = error || 'Transaction not found'
    return (
      <div className="space-y-4">
        <AdminAlertModal
          open={!errorDismissed}
          title="Could not load transaction"
          message={failureMessage}
          onClose={() => setErrorDismissed(true)}
        />
        <Link to="/transactions" state={backState} className={secondaryBtnClass}>
          Back to Transactions
        </Link>
      </div>
    )
  }

  const reasons = (transaction.purchaseReasons || []).map((reason) =>
    formatPurchaseReason(reason, transaction.purchaseReasonOther),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-3">
        <Link to="/transactions" state={backState} className={secondaryBtnClass}>
          Back to Transactions
        </Link>
      </div>

      <div className={compactFormClass}>
        <FormStep
          step="1"
          title="Transaction summary"
          hint="Payment result and amount"
          tone="emerald"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">Status</label>
              <div
                className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${
                  statusStyles[transaction.transactionStatus] || 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {transaction.transactionStatusLabel}
              </div>
            </div>
            <div className="sm:col-span-2">
              <OrderAmountSummary order={transaction} totalLabel="Total" />
            </div>
            <ReadOnlyField label="Created on" value={formatDate(transaction.createdAt)} />
            <ReadOnlyField label="Last updated" value={formatDate(transaction.updatedAt)} />
          </div>
        </FormStep>

        <FormStep step="2" title="Customer" hint="Billing contact details" tone="sky">
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField label="Name" value={transaction.customerName} />
            <ReadOnlyField label="Email" value={transaction.customerEmail} />
            <ReadOnlyField label="Phone" value={transaction.customerPhone} />
            <ReadOnlyField
              label="Purchase reason"
              value={reasons.length ? reasons.join(', ') : '—'}
            />
          </div>
        </FormStep>

        <FormStep step="3" title="Payment" hint="Method and payment state" tone="violet">
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField
              label="Payment method"
              value="Online"
            />
            <ReadOnlyField label="Payment status" value={transaction.paymentStatus} />
            <ReadOnlyField label="Order status" value={transaction.orderStatus} />
            <ReadOnlyField label="Currency" value={transaction.currency} />
          </div>
        </FormStep>

        <FormStep step="4" title="Reference IDs" hint="Order and payment references" tone="amber">
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField label="Order ID" value={transaction.orderId} />
            <ReadOnlyField
              label="Transaction ID"
              value={transaction.transactionId || transaction.razorpayPaymentId}
            />
            <ReadOnlyField label="Razorpay payment ID" value={transaction.razorpayPaymentId} />
          </div>
          <div className="mt-4">
            <Link
              to={`/orders/${transaction.orderId}`}
              className="text-sm font-semibold text-slate-900 hover:underline"
            >
              Open full order →
            </Link>
          </div>
        </FormStep>

        <FormStep
          step="5"
          title={`Purchased items (${transaction.itemCount})`}
          hint="Products included in this transaction"
        >
          <div className="admin-scrollbar overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[48rem] divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3">Product</th>
                  <th className="hidden px-3 py-2.5 sm:table-cell sm:px-4 sm:py-3">Clip ID</th>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3">License</th>
                  <th className="hidden px-3 py-2.5 md:table-cell sm:px-4 sm:py-3">License No</th>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3">Qty</th>
                  <th className="hidden px-3 py-2.5 sm:table-cell sm:px-4 sm:py-3">Subtotal</th>
                  <th className="hidden px-3 py-2.5 lg:table-cell sm:px-4 sm:py-3">Promo</th>
                  <th className="hidden px-3 py-2.5 lg:table-cell sm:px-4 sm:py-3">GST</th>
                  <th className="px-3 py-2.5 sm:px-4 sm:py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transaction.items?.map((item, index) => {
                  const lineAmounts = getOrderLineAmountBreakdown(item, transaction)

                  return (
                    <tr key={`${item.productId}-${item.imageSize}-${index}`}>
                      <td className="px-3 py-2.5 font-medium text-slate-900 sm:px-4 sm:py-3">
                        <p>{item.name}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-slate-500 sm:hidden">{item.clipId || '—'}</p>
                      </td>
                      <td className="hidden px-3 py-2.5 font-mono text-xs text-slate-600 sm:table-cell sm:px-4 sm:py-3">
                        {item.clipId || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 sm:px-4 sm:py-3">{item.imageSize || '—'}</td>
                      <td className="hidden px-3 py-2.5 font-mono text-xs text-slate-600 md:table-cell sm:px-4 sm:py-3">
                        {item.licenseNumber || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 sm:px-4 sm:py-3">{item.quantity}</td>
                      <td className="hidden px-3 py-2.5 text-slate-600 sm:table-cell sm:px-4 sm:py-3">
                        {formatCurrency(lineAmounts.subtotal)}
                      </td>
                      <td className="hidden px-3 py-2.5 text-emerald-700 lg:table-cell sm:px-4 sm:py-3">
                        {lineAmounts.discountAmount > 0 ? `-${formatCurrency(lineAmounts.discountAmount)}` : '—'}
                      </td>
                      <td className="hidden px-3 py-2.5 text-slate-600 lg:table-cell sm:px-4 sm:py-3">
                        {formatCurrency(lineAmounts.gst)}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-900 sm:px-4 sm:py-3">
                        {formatCurrency(lineAmounts.total)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </FormStep>
      </div>
    </div>
  )
}

export default TransactionDetail
