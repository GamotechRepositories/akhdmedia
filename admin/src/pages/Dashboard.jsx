import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import OrdersBarChart, { buildMonthlyOrderStats } from '../components/OrdersBarChart'
import { cardClass, primaryBtnClass } from '../components/ui/adminUi'
import { BRAND } from '../config/brand'
import {
  fetchCategories,
  fetchOrders,
  fetchProducts,
  fetchTransactions,
  reseedCatalog,
} from '../api/client'

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

const StatCard = ({ label, value, hint, accent, to, linkLabel }) => (
  <div className={`${cardClass} relative overflow-hidden p-6`}>
    <div className={`absolute inset-x-0 top-0 h-1 ${accent}`} />
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
    {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    {to && (
      <Link to={to} className="mt-5 inline-flex text-sm font-semibold text-slate-900 hover:underline">
        {linkLabel} →
      </Link>
    )}
  </div>
)

const QuickAction = ({ title, description, to, accent }) => (
  <Link
    to={to}
    className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
  >
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
    </div>
    <div>
      <p className="font-semibold text-slate-900 group-hover:text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  </Link>
)

const Dashboard = () => {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [transactionSummary, setTransactionSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [categoriesRes, productsRes, ordersRes, transactionsRes] = await Promise.all([
        fetchCategories(),
        fetchProducts(),
        fetchOrders(),
        fetchTransactions(),
      ])

      setCategories(categoriesRes.data || [])
      setProducts(productsRes.data || [])
      setOrders(ordersRes.data.data?.orders || [])
      setTransactionSummary(transactionsRes.data.data?.summary || null)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const monthlyStats = useMemo(() => buildMonthlyOrderStats(orders, 6), [orders])

  const paidOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus === 'paid').length,
    [orders],
  )

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus === 'pending').length,
    [orders],
  )

  const activeProducts = useMemo(
    () => products.filter((product) => product.isActive).length,
    [products],
  )

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 6),
    [orders],
  )

  const todayLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const handleReseed = async () => {
    if (!window.confirm('This will reset all categories and products. Continue?')) return

    try {
      await reseedCatalog()
      setMessage('Catalog reseeded successfully.')
      await loadDashboard()
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 text-white shadow-xl shadow-slate-900/10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">Admin Overview</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back, {BRAND.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
              Track sales performance, monitor orders, and manage your stock media catalog from one place.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Today</p>
            <p className="mt-1 text-sm font-semibold text-white">{todayLabel}</p>
          </div>
        </div>
      </section>

      {message && (
        <div className={`${cardClass} px-5 py-4 text-sm text-slate-700`}>{message}</div>
      )}

      <section className={`${cardClass} p-6 sm:p-8`}>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Sales analytics</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Orders by month</h2>
            <p className="mt-1 text-sm text-slate-500">
              Monthly order volume across the last 6 months
            </p>
          </div>
          <Link
            to="/orders"
            className="inline-flex text-sm font-semibold text-slate-900 hover:underline"
          >
            View all orders →
          </Link>
        </div>
        <OrdersBarChart data={monthlyStats} loading={loading} />
      </section>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total revenue"
          value={loading ? '—' : formatCurrency(transactionSummary?.revenue || 0)}
          hint="Paid online transactions"
          accent="bg-violet-500"
          to="/transactions"
          linkLabel="View transactions"
        />
        <StatCard
          label="Total orders"
          value={loading ? '—' : orders.length}
          hint={`${paidOrders} paid · ${pendingOrders} pending`}
          accent="bg-slate-900"
          to="/orders"
          linkLabel="View orders"
        />
        <StatCard
          label="Successful payments"
          value={loading ? '—' : transactionSummary?.successful || 0}
          hint={`${transactionSummary?.failed || 0} failed · ${transactionSummary?.pending || 0} pending`}
          accent="bg-emerald-500"
          to="/transactions"
          linkLabel="Payment history"
        />
        <StatCard
          label="Products"
          value={loading ? '—' : products.length}
          hint={`${activeProducts} active listings`}
          accent="bg-sky-500"
          to="/products"
          linkLabel="Manage products"
        />
        <StatCard
          label="Categories"
          value={loading ? '—' : categories.length}
          hint="Storefront navigation groups"
          accent="bg-amber-500"
          to="/categories"
          linkLabel="Manage categories"
        />
        <StatCard
          label="Avg order value"
          value={
            loading
              ? '—'
              : formatCurrency(
                  paidOrders > 0
                    ? (transactionSummary?.revenue || 0) / paidOrders
                    : 0,
                )
          }
          hint="Based on paid orders"
          accent="bg-rose-500"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className={`${cardClass} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent orders</h2>
              <p className="mt-1 text-sm text-slate-500">Latest customer purchases</p>
            </div>
            <Link to="/orders" className="text-sm font-semibold text-slate-900 hover:underline">
              See all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <p className="px-6 py-8 text-sm text-slate-500">Loading recent orders...</p>
            ) : recentOrders.length === 0 ? (
              <p className="px-6 py-8 text-sm text-slate-500">No orders yet.</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      #{shortOrderNumber(order.orderNumber)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.billingAddress?.name || 'Customer'}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-4 sm:text-right">
                    <div>
                      <p className="font-bold text-slate-900">{formatCurrency(order.totalAmount)}</p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700'
                            : order.paymentStatus === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.paymentStatus || 'unknown'}
                      </span>
                    </div>
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-sm font-semibold text-slate-900 hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className={`${cardClass} p-6`}>
            <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
            <p className="mt-1 text-sm text-slate-500">Jump into common admin tasks</p>
            <div className="mt-5 space-y-3">
              <QuickAction
                title="Add new product"
                description="Upload a video clip or stock image"
                to="/products/new"
                accent="bg-slate-900 text-white"
              />
              <QuickAction
                title="Manage categories"
                description="Update navbar and subcategories"
                to="/categories"
                accent="bg-amber-100 text-amber-800"
              />
              <QuickAction
                title="Review transactions"
                description="Check Razorpay payment activity"
                to="/transactions"
                accent="bg-violet-100 text-violet-800"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-amber-950">Developer tools</h3>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
              Reseed the database with default categories and products from the original mock data.
            </p>
            <button
              type="button"
              onClick={handleReseed}
              className={`${primaryBtnClass} mt-4 bg-amber-950 hover:bg-amber-900`}
            >
              Reseed catalog
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard
