import { useEffect, useState } from 'react'
import PageLoader from './ui/PageLoader'

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const formatCompactCurrency = (amount = 0) => {
  const value = Number(amount) || 0
  if (value >= 100000) return `₹${(value / 100000).toFixed(value >= 1000000 ? 0 : 1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  return formatCurrency(value)
}

const buildAxisTicks = (max, segments = 4) => {
  if (max <= 0) return [0]

  if (max <= segments) {
    return Array.from({ length: max + 1 }, (_, index) => index)
  }

  const roughStep = max / segments
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalized = roughStep / magnitude
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  const step = niceNormalized * magnitude
  const niceMax = Math.ceil(max / step) * step

  const ticks = []
  for (let value = 0; value <= niceMax; value += step) {
    ticks.push(Math.round(value))
  }

  return ticks
}

const buildRevenueAxisTicks = (max, segments = 4) => {
  if (max <= 0) return [0]

  const roughStep = max / segments
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalized = roughStep / magnitude
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  const step = niceNormalized * magnitude
  const niceMax = Math.ceil(max / step) * step

  const ticks = []
  for (let value = 0; value <= niceMax; value += step) {
    ticks.push(value)
  }

  return ticks
}

const barHeight = (value, max, hasValue) => {
  if (!hasValue) return 4
  return Math.max((value / max) * 100, 12)
}

const OrdersBarChart = ({ data = [], loading = false }) => {
  const [activeKey, setActiveKey] = useState(null)
  const maxOrders = Math.max(...data.map((item) => item.orders), 1)
  const maxRevenue = Math.max(...data.map((item) => item.revenue), 1)
  const orderTicks = buildAxisTicks(maxOrders)
  const revenueTicks = buildRevenueAxisTicks(maxRevenue)
  const orderAxisMax = orderTicks[orderTicks.length - 1] || 1
  const revenueAxisMax = revenueTicks[revenueTicks.length - 1] || 1

  useEffect(() => {
    setActiveKey(null)
  }, [data])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80">
        <PageLoader label="Loading chart..." minHeight="" compact />
      </div>
    )
  }

  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80">
        <p className="text-sm text-slate-500">No order data yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 sm:gap-3">
        <div className="flex w-9 shrink-0 flex-col sm:w-11">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-slate-500 sm:text-[10px]">
            Ord
          </p>
          <div className="relative flex h-52 flex-col justify-between pb-0 text-right">
            {[...orderTicks].reverse().map((tick) => (
              <span key={`order-${tick}`} className="text-[9px] font-semibold leading-none text-slate-600 sm:text-[10px]">
                {tick}
              </span>
            ))}
          </div>
          <div className="mt-3 h-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-52">
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
              {orderTicks.map((tick) => (
                <div key={`grid-${tick}`} className="border-t border-slate-100" />
              ))}
            </div>

            <div className="relative flex h-full gap-1.5 sm:gap-2 md:gap-3">
        {data.map((item) => {
          const isActive = activeKey === item.key
          const ordersHeight = barHeight(item.orders, orderAxisMax, item.orders > 0)
          const revenueHeight = barHeight(item.revenue, revenueAxisMax, item.revenue > 0)
          const upcoming = item.isUpcoming

          const ordersBarClass = upcoming
            ? 'border border-dashed border-slate-300 bg-gradient-to-t from-slate-200 to-slate-100'
            : 'bg-gradient-to-t from-slate-900 to-slate-700 group-hover:from-violet-700 group-hover:to-violet-500'

          const revenueBarClass = upcoming
            ? 'border border-dashed border-emerald-200 bg-gradient-to-t from-emerald-100 to-emerald-50'
            : 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-700 group-hover:to-emerald-500'

          return (
            <div
              key={item.key}
              className="group flex min-w-0 flex-1 cursor-pointer flex-col"
              onClick={() => setActiveKey((current) => (current === item.key ? null : item.key))}
            >
              <div
                className={`relative flex flex-1 flex-col justify-end rounded-lg px-0.5 transition-colors ${
                  upcoming ? 'bg-slate-50/40' : 'group-hover:bg-slate-50/80'
                }`}
              >
                <div
                  className={`pointer-events-none absolute left-1/2 top-1 z-10 flex -translate-x-1/2 flex-col items-center gap-0.5 whitespace-nowrap text-[10px] font-bold transition-opacity sm:text-xs ${
                    isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <span className={upcoming ? 'text-slate-500' : 'text-slate-900'}>
                    {item.orders} orders
                  </span>
                  <span className={upcoming ? 'text-emerald-400' : 'text-emerald-700'}>
                    {formatCurrency(item.revenue)}
                  </span>
                </div>

                <div className="flex h-full min-h-0 w-full items-end gap-0.5 pt-10 sm:gap-1 sm:pt-12">
                  <div
                    className={`flex-1 rounded-t-lg shadow-sm transition-all duration-300 ${ordersBarClass}`}
                    style={{
                      height: `${ordersHeight}%`,
                      minHeight: item.orders > 0 ? '1.5rem' : '0.25rem',
                    }}
                    title={`${item.label} ${item.year}: ${item.orders} orders`}
                  />
                  <div
                    className={`flex-1 rounded-t-lg shadow-sm transition-all duration-300 ${revenueBarClass}`}
                    style={{
                      height: `${revenueHeight}%`,
                      minHeight: item.revenue > 0 ? '1.5rem' : '0.25rem',
                    }}
                    title={`${item.label} ${item.year}: ${formatCurrency(item.revenue)} revenue`}
                  />
                </div>
              </div>

            </div>
          )
        })}
            </div>
          </div>

          <div className="mt-3 flex gap-1.5 sm:gap-2 md:gap-3">
            {data.map((item) => (
              <div key={`${item.key}-label`} className="min-w-0 flex-1 text-center">
                <p
                  className={`text-[10px] font-semibold sm:text-xs ${
                    item.isUpcoming ? 'text-slate-400' : 'text-slate-700'
                  }`}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex w-9 shrink-0 flex-col sm:w-11">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-wide text-emerald-600 sm:text-[10px]">
            Rev
          </p>
          <div className="relative flex h-52 flex-col justify-between pb-0 text-left">
            {[...revenueTicks].reverse().map((tick) => (
              <span key={`revenue-${tick}`} className="text-[9px] font-semibold leading-none text-emerald-600 sm:text-[10px]">
                {formatCompactCurrency(tick)}
              </span>
            ))}
          </div>
          <div className="mt-3 h-4" />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-800" />
            Orders
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            Revenue
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-slate-300 bg-slate-100" />
            Upcoming
          </span>
        </div>
        <p>
          Total revenue in period:{' '}
          <span className="font-semibold text-slate-900">
            {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0))}
          </span>
        </p>
      </div>
    </div>
  )
}

/** Current year and the previous 5 years — no future years */
export const getChartYearOptions = () => {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, index) => currentYear - index)
}

export const getAvailableOrderYears = getChartYearOptions

export const buildMonthlyOrderStats = (orders = [], year = new Date().getFullYear()) => {
  const buckets = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  for (let month = 0; month < 12; month += 1) {
    const date = new Date(year, month, 1)
    buckets.push({
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('en-IN', { month: 'short' }),
      year,
      month,
      isUpcoming: year === currentYear && month > currentMonth,
      orders: 0,
      revenue: 0,
    })
  }

  const bucketMap = Object.fromEntries(buckets.map((bucket) => [bucket.key, bucket]))

  orders.forEach((order) => {
    const created = new Date(order.createdAt)
    if (Number.isNaN(created.getTime())) return

    const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`
    const bucket = bucketMap[key]
    if (!bucket) return

    bucket.orders += 1
    if (order.paymentStatus === 'paid') {
      bucket.revenue += Number(order.totalAmount) || 0
    }
  })

  return buckets
}

export default OrdersBarChart
