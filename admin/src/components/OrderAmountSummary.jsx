import { getOrderAmountBreakdown } from '../utils/orderAmounts'

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const OrderAmountSummary = ({
  order,
  totalLabel = 'Total',
  className = '',
  compact = false,
}) => {
  const { subtotal, taxableSubtotal, gst, promoCode, discountAmount, total } = getOrderAmountBreakdown(
    order || {},
  )

  if (compact) {
    return (
      <div className={`text-right text-sm ${className}`.trim()}>
        <p className="text-xs text-slate-500">
          Subtotal <span className="font-medium text-slate-800">{formatCurrency(subtotal)}</span>
        </p>
        {discountAmount > 0 && (
          <p className="mt-0.5 text-xs text-emerald-700">
            Promo ({promoCode}) <span className="font-medium">-{formatCurrency(discountAmount)}</span>
          </p>
        )}
        {discountAmount > 0 && (
          <p className="mt-0.5 text-xs text-slate-500">
            Taxable <span className="font-medium text-slate-800">{formatCurrency(taxableSubtotal)}</span>
          </p>
        )}
        <p className="mt-0.5 text-xs text-slate-500">
          GST <span className="font-medium text-slate-800">{formatCurrency(gst)}</span>
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(total)}</p>
      </div>
    )
  }

  return (
    <div className={`space-y-2 text-sm ${className}`.trim()}>
      <div className="flex justify-between gap-4">
        <span className="text-slate-600">Subtotal</span>
        <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between gap-4 text-emerald-700">
          <span>Promo ({promoCode})</span>
          <span className="font-medium">-{formatCurrency(discountAmount)}</span>
        </div>
      )}
      {discountAmount > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-slate-600">Taxable value</span>
          <span className="font-medium text-slate-900">{formatCurrency(taxableSubtotal)}</span>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <span className="text-slate-600">GST</span>
        <span className="font-medium text-slate-900">{formatCurrency(gst)}</span>
      </div>
      <div className="flex justify-between gap-4 border-t border-slate-100 pt-2">
        <span className="font-semibold text-slate-900">{totalLabel}</span>
        <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}

export default OrderAmountSummary
