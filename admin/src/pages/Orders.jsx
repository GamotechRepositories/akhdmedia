import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrders } from '../api/client'
import PageHeader from '../components/PageHeader'
import { tableWrapClass } from '../components/ui/adminUi'

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

const shortOrderNumber = (orderNumber = '') => orderNumber.slice(-8).toUpperCase()

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchOrders()
        setOrders(response.data.data?.orders || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [])

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description="View customer orders, billing details, and purchased licenses."
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className={tableWrapClass}>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Loading orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    #{shortOrderNumber(order.orderNumber)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {order.billingAddress?.name || '—'}
                    </p>
                    <p className="text-xs text-slate-500">{order.billingAddress?.email || '—'}</p>
                    <p className="text-xs text-slate-500">{order.billingAddress?.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {order.items?.length || 0} item{(order.items?.length || 0) === 1 ? '' : 's'}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    Online
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                      {order.status || 'confirmed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/orders/${order.id}`}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Orders
