import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { fetchUser } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import OrderAmountSummary from '../components/OrderAmountSummary'
import FormStep from '../components/FormStep'
import PageLoader from '../components/ui/PageLoader'
import AdminTable from '../components/ui/AdminTable'
import {
  actionViewClass,
  cardClass,
  compactFormClass,
  inputClass,
  secondaryBtnClass,
  statGridClass,
  tableBodyClass,
  tableHeadClass,
  tableRowClass,
  tdClass,
  tdHideLg,
  tdHideMd,
  tdPrimaryClass,
  tdRightClass,
  thClass,
  thHideLg,
  thHideMd,
  thRightClass,
} from '../components/ui/adminUi'
import { ADMIN_PERMISSIONS } from '../constants/adminPermissions'
import { useAuth } from '../context/AuthContext'

const paymentStatusStyles = {
  paid: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
}

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

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const shortOrderNumber = (orderNumber = '') => orderNumber.slice(-8).toUpperCase()

const ReadOnlyField = ({ label, value }) => (
  <div>
    <label className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</label>
    <div className={`${inputClass} mt-0 cursor-default bg-white text-slate-900`}>{value || '—'}</div>
  </div>
)

const UserDetail = () => {
  const { id } = useParams()
  const location = useLocation()
  const { hasPermission } = useAuth()
  const canViewOrders = hasPermission(ADMIN_PERMISSIONS.ORDERS_READ)
  const backState = location.state?.fromList ? { restore: location.state.fromList } : undefined

  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [orderStats, setOrderStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [errorDismissed, setErrorDismissed] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchUser(id)
        const payload = response.data?.data || {}
        setUser(payload.user || null)
        setOrders(payload.orders || [])
        setOrderStats(payload.orderStats || null)
      } catch (loadError) {
        setError(loadError.message || 'Could not load user')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [id])

  useEffect(() => {
    setErrorDismissed(false)
  }, [id])

  if (loading) {
    return <PageLoader label="Loading user profile..." />
  }

  if (error || !user) {
    const failureMessage = error || 'User not found'
    return (
      <div className="space-y-4">
        <AdminAlertModal
          open={!errorDismissed}
          title="Could not load user"
          message={failureMessage}
          onClose={() => setErrorDismissed(true)}
        />
        <Link to="/users" state={backState} className={secondaryBtnClass}>
          Back to Users
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-3">
        <Link to="/users" state={backState} className={secondaryBtnClass}>
          Back to Users
        </Link>
      </div>

      <div className={statGridClass}>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total orders</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{orderStats?.totalOrders ?? 0}</p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Paid orders</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{orderStats?.paidOrders ?? 0}</p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total spent</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatCurrency(orderStats?.totalSpent ?? 0)}
          </p>
        </div>
      </div>

      <div className={compactFormClass}>
        <FormStep step="1" title="Profile" hint="Registered customer details" tone="sky">
          <div className="grid gap-3 sm:grid-cols-2">
            <ReadOnlyField label="Name" value={user.name} />
            <ReadOnlyField label="Email" value={user.email} />
            <ReadOnlyField label="Phone" value={user.phone} />
            <ReadOnlyField label="Joined on" value={formatDate(user.createdAt)} />
            <ReadOnlyField label="First order" value={formatDate(orderStats?.firstOrderAt)} />
            <ReadOnlyField label="Latest order" value={formatDate(orderStats?.lastOrderAt)} />
          </div>
        </FormStep>

        <FormStep
          step="2"
          title="Order history"
          hint={`${orders.length} order${orders.length === 1 ? '' : 's'} linked to this account`}
          tone="emerald"
        >
          {orders.length === 0 ? (
            <p className="text-sm text-slate-600">This user has not placed any orders yet.</p>
          ) : (
            <AdminTable>
              <thead className={tableHeadClass}>
                <tr>
                  <th className={thClass}>Order</th>
                  <th className={thClass}>Items</th>
                  <th className={thClass}>Total</th>
                  <th className={thHideMd}>Payment</th>
                  <th className={thHideLg}>Status</th>
                  <th className={thHideLg}>Date</th>
                  {canViewOrders ? <th className={thRightClass}>Actions</th> : null}
                </tr>
              </thead>
              <tbody className={tableBodyClass}>
                {orders.map((order) => (
                  <tr key={order.id} className={tableRowClass}>
                    <td className={tdPrimaryClass}>#{shortOrderNumber(order.orderNumber)}</td>
                    <td className={tdClass}>
                      <p className="text-slate-900">{order.items?.length || 0} item(s)</p>
                      {order.items?.length ? (
                        <ul className="mt-1 space-y-0.5">
                          {order.items.map((item, index) => (
                            <li key={`${order.id}-${index}`} className="truncate text-xs text-slate-500">
                              {item.name}
                              {item.imageSize ? ` · ${item.imageSize}` : ''}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                    <td className={tdClass}>
                      <OrderAmountSummary order={order} compact />
                    </td>
                    <td className={tdHideMd}>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${
                          paymentStatusStyles[order.paymentStatus] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.paymentStatus || '—'}
                      </span>
                    </td>
                    <td className={tdHideLg}>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-700">
                        {order.status || 'confirmed'}
                      </span>
                    </td>
                    <td className={`${tdHideLg} text-slate-600`}>{formatDate(order.createdAt)}</td>
                    {canViewOrders ? (
                      <td className={tdRightClass}>
                        <Link
                          to={`/orders/${order.id}`}
                          state={{
                            fromList: {
                              page: 1,
                              userId: user.id,
                            },
                          }}
                          className={actionViewClass}
                        >
                          View
                        </Link>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          )}
        </FormStep>
      </div>
    </div>
  )
}

export default UserDetail
