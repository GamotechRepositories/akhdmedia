const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const OrdersBarChart = ({ data = [], loading = false }) => {
  const maxOrders = Math.max(...data.map((item) => item.orders), 1)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80">
        <p className="text-sm text-slate-500">Loading chart...</p>
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
      <div className="flex h-64 items-end gap-1.5 sm:gap-2 md:gap-3">
        {data.map((item) => {
          const height = item.orders > 0 ? Math.max((item.orders / maxOrders) * 100, 12) : 4

          return (
            <div key={item.key} className="group flex min-w-0 flex-1 flex-col items-center">
              <p className="mb-2 text-xs font-bold text-slate-900">{item.orders}</p>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="relative w-full rounded-t-xl bg-gradient-to-t from-slate-900 to-slate-700 shadow-sm transition-all duration-300 group-hover:from-violet-700 group-hover:to-violet-500"
                  style={{ height: `${height}%`, minHeight: item.orders > 0 ? '1.5rem' : '0.25rem' }}
                  title={`${item.label} ${item.year}: ${item.orders} orders, ${formatCurrency(item.revenue)} revenue`}
                />
              </div>
              <div className="mt-3 text-center">
                <p className="text-[10px] font-semibold text-slate-700 sm:text-xs">{item.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <p>
          Monthly order count ({data[0]?.year || new Date().getFullYear()})
        </p>
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

  for (let month = 0; month < 12; month += 1) {
    const date = new Date(year, month, 1)
    buckets.push({
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('en-IN', { month: 'short' }),
      year,
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
