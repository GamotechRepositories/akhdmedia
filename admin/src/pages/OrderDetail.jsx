import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import AdminAlertModal from '../components/AdminAlertModal'
import { fetchOrder } from '../api/client'
import { cardClass, secondaryBtnClass } from '../components/ui/adminUi'

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

const OrderDetail = () => {
  const { id } = useParams()
  const location = useLocation()
  const backState = location.state?.fromList
    ? { restore: location.state.fromList }
    : undefined
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errorDismissed, setErrorDismissed] = useState(false)

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchOrder(id)
        setOrder(response.data.data?.order || null)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [id])

  useEffect(() => {
    setErrorDismissed(false)
  }, [id])

  if (loading) {
    return <p className="text-sm text-slate-500">Loading order...</p>
  }

  if (error || !order) {
    const failureMessage = error || 'Order not found'
    return (
      <div className="space-y-4">
        <AdminAlertModal
          open={!errorDismissed}
          title="Could not load order"
          message={failureMessage}
          onClose={() => setErrorDismissed(true)}
        />
        <Link to="/orders" state={backState} className={secondaryBtnClass}>
          Back to Orders
        </Link>
      </div>
    )
  }

  const reasons = (order.billingAddress?.purchaseReasons || []).map((reason) =>
    formatPurchaseReason(reason, order.billingAddress?.purchaseReasonOther),
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-3">
        <Link to="/orders" state={backState} className={secondaryBtnClass}>
          Back to Orders
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className={`${cardClass} p-5`}>
          <h2 className="text-sm font-semibold text-slate-900">Customer</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900">{order.billingAddress?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="font-medium text-slate-900">{order.billingAddress?.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Phone</dt>
              <dd className="font-medium text-slate-900">{order.billingAddress?.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Purchase reason</dt>
              <dd className="font-medium text-slate-900">
                {reasons.length ? reasons.join(', ') : '—'}
              </dd>
            </div>
          </dl>
        </div>

        <div className={`${cardClass} p-5`}>
          <h2 className="text-sm font-semibold text-slate-900">Order summary</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-slate-500">Order number</dt>
              <dd className="font-medium text-slate-900">{order.orderNumber}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Payment</dt>
              <dd className="font-medium text-slate-900">
                Online Payment
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Payment status</dt>
              <dd className="font-medium capitalize text-slate-900">
                {order.paymentStatus || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Razorpay order ID</dt>
              <dd className="break-all font-mono text-xs text-slate-900">
                {order.razorpayOrderId || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Razorpay payment ID</dt>
              <dd className="break-all font-mono text-xs text-slate-900">
                {order.razorpayPaymentId || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium capitalize text-slate-900">{order.status}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Total</dt>
              <dd className="text-lg font-bold text-slate-900">
                {formatCurrency(order.totalAmount)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Purchased items</h2>
        </div>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Clip ID</th>
              <th className="px-4 py-3">License</th>
              <th className="px-4 py-3">License No</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items?.map((item, index) => (
              <tr key={`${item.productId}-${item.imageSize}-${index}`}>
                <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.clipId || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{item.imageSize || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{item.licenseNumber || '—'}</td>
                <td className="px-4 py-3 text-slate-600">{item.quantity}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(item.price)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {formatCurrency(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default OrderDetail
