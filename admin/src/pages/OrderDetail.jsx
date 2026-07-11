import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import AdminAlertModal from '../components/AdminAlertModal'
import OrderAmountSummary from '../components/OrderAmountSummary'
import { deleteOrder, fetchOrder } from '../api/client'
import { getOrderLineAmountBreakdown } from '../utils/orderAmounts'
import PageLoader from '../components/ui/PageLoader'
import { cardClass, secondaryBtnClass, actionDeleteClass } from '../components/ui/adminUi'

const PURCHASE_REASON_LABELS = {
  personal: 'Personal collection',
  digital: 'Digital media',
  outlet: 'Media agency',
  other: 'Other',
}

const formatPurchaseReason = (reason, otherText = '') => {
  const detail = otherText.trim()
  if (detail) {
    if (reason === 'other') return `Other: ${detail}`
    if (reason === 'digital') return `Digital media: ${detail}`
    if (reason === 'outlet') return `Media agency: ${detail}`
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
  const navigate = useNavigate()
  const fromList = location.state?.fromList
  const backState = {
    restore: {
      orderId: fromList?.orderId || id,
      page: fromList?.page || 1,
      searchQuery: fromList?.searchQuery || '',
      customerEmail: fromList?.customerEmail || '',
      paymentFilter: fromList?.paymentFilter || 'all',
      statusFilter: fromList?.statusFilter || 'all',
      dateFrom: fromList?.dateFrom || '',
      dateTo: fromList?.dateTo || '',
      scrollTop: fromList?.scrollTop ?? 0,
    },
  }
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errorDismissed, setErrorDismissed] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const handleDelete = async () => {
    if (
      !window.confirm(
        `Delete order ${order?.orderNumber || ''}? This permanently removes the order and any linked transaction record.`,
      )
    ) {
      return
    }

    setDeleting(true)
    setError('')
    try {
      await deleteOrder(id)
      navigate('/orders', { state: backState })
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete order')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <PageLoader label="Loading order..." />
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
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={actionDeleteClass}
        >
          {deleting ? 'Deleting...' : 'Delete Order'}
        </button>
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
              <dt className="text-slate-500">Payment provider</dt>
              <dd className="font-medium capitalize text-slate-900">
                {order.paymentProvider || 'razorpay'}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Transaction ID</dt>
              <dd className="break-all font-mono text-xs text-slate-900">
                {(order.paymentProvider === 'paypal'
                  ? order.paypalCaptureId || order.paypalOrderId
                  : order.razorpayPaymentId) || '—'}
              </dd>
            </div>
            {order.paymentProvider === 'paypal' ? (
              <>
                <div>
                  <dt className="text-slate-500">PayPal capture ID</dt>
                  <dd className="break-all font-mono text-xs text-slate-900">
                    {order.paypalCaptureId || '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">PayPal order ID</dt>
                  <dd className="break-all font-mono text-xs text-slate-900">
                    {order.paypalOrderId || '—'}
                  </dd>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
            <div>
              <dt className="text-slate-500">Status</dt>
              <dd className="font-medium capitalize text-slate-900">{order.status}</dd>
            </div>
            <div className="sm:col-span-2">
              <OrderAmountSummary order={order} totalLabel="Total" />
            </div>
          </dl>
        </div>
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <div className="border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-sm font-semibold text-slate-900">Purchased items</h2>
        </div>
        <div className="admin-scrollbar overflow-x-auto">
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
              {order.items?.map((item, index) => {
                const lineAmounts = getOrderLineAmountBreakdown(item, order)

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
      </div>

      <AdminAlertModal
        open={Boolean(error)}
        title="Could not delete order"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default OrderDetail
