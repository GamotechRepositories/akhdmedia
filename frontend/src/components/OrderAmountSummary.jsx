import { formatCurrency, formatPayableCurrency } from '../utils/formatters';
import { getOrderAmountBreakdown } from '../utils/orderAmounts';

const OrderAmountSummary = ({
  order,
  totalLabel = 'Total payable',
  className = '',
  compact = false,
  usePayableGst = true,
}) => {
  const { subtotal, taxableSubtotal, gst, promoCode, discountAmount, total } = getOrderAmountBreakdown(
    order || {},
  );
  const gstFormatter = usePayableGst ? formatPayableCurrency : formatCurrency;

  if (compact) {
    return (
      <div className={`text-right text-sm ${className}`.trim()}>
        <p className="text-xs text-gray-500">
          Subtotal <span className="font-medium text-gray-800">{formatCurrency(subtotal)}</span>
        </p>
        {discountAmount > 0 && (
          <p className="mt-0.5 text-xs text-emerald-700">
            Promo ({promoCode}) <span className="font-medium">-{formatCurrency(discountAmount)}</span>
          </p>
        )}
        {discountAmount > 0 && (
          <p className="mt-0.5 text-xs text-gray-500">
            Taxable value{' '}
            <span className="font-medium text-gray-800">{formatCurrency(taxableSubtotal)}</span>
          </p>
        )}
        <p className="mt-0.5 text-xs text-gray-500">
          GST <span className="font-medium text-gray-800">{gstFormatter(gst)}</span>
        </p>
        <p className="mt-1 text-lg font-bold text-gray-900">{formatPayableCurrency(total)}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 text-sm ${className}`.trim()}>
      <div className="flex justify-between gap-4">
        <span className="text-gray-600">Subtotal</span>
        <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between gap-4 text-emerald-700">
          <span>Promo ({promoCode})</span>
          <span className="font-medium">-{formatCurrency(discountAmount)}</span>
        </div>
      )}
      {discountAmount > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-gray-600">Taxable value</span>
          <span className="font-medium text-gray-900">{formatCurrency(taxableSubtotal)}</span>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <span className="text-gray-600">GST</span>
        <span className="font-medium text-gray-900">{gstFormatter(gst)}</span>
      </div>
      <div className="flex justify-between gap-4 border-t border-gray-100 pt-2">
        <span className="font-semibold text-gray-900">{totalLabel}</span>
        <span className="font-bold text-gray-900">{formatPayableCurrency(total)}</span>
      </div>
    </div>
  );
};

export default OrderAmountSummary;
