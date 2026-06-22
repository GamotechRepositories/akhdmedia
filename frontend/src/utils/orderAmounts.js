import { buildPayableTotals, roundMoney } from './money';

export const getOrderAmountBreakdown = (order = {}) => {
  const items = order.items || [];

  const subtotalFromItems = items.reduce(
    (sum, item) => sum + (Number(item.basePrice) || 0) * (item.quantity || 1),
    0,
  );
  const gstFromItems = items.reduce(
    (sum, item) => sum + (Number(item.gstAmount) || 0) * (item.quantity || 1),
    0,
  );

  const hasOrderSubtotal = order.subtotalAmount != null && order.subtotalAmount > 0;
  const hasOrderGst = order.gstAmount != null;

  const subtotal = hasOrderSubtotal ? order.subtotalAmount : subtotalFromItems || order.totalAmount || 0;
  const gst = hasOrderGst ? order.gstAmount : gstFromItems;
  const discountAmount = Number(order.discountAmount) || 0;
  const promoCode = order.promoCode || '';
  const taxableSubtotal = Math.max(0, roundMoney(subtotal - discountAmount));
  const total =
    order.totalAmount ??
    order.amount ??
    Math.max(0, taxableSubtotal + gst);

  return { subtotal, taxableSubtotal, gst, promoCode, discountAmount, total };
};

export const getOrderLineAmountBreakdown = (item, order = {}) => {
  const quantity = item.quantity || 1;
  const lineSubtotal = (Number(item.basePrice) || 0) * quantity;
  const lineGst = (Number(item.gstAmount) || 0) * quantity;
  const total = item.lineTotal ?? roundMoney(lineSubtotal + lineGst);

  const orderSubtotal = Number(order.subtotalAmount) || 0;
  const orderDiscount = Number(order.discountAmount) || 0;
  const discountAmount =
    orderSubtotal > 0 ? roundMoney((orderDiscount * lineSubtotal) / orderSubtotal) : 0;

  return {
    subtotal: lineSubtotal,
    discountAmount,
    gst: lineGst,
    promoCode: order.promoCode || '',
    total,
  };
};
