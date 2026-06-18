import { buildPayableTotals } from './money';

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
  const total = order.totalAmount ?? order.amount ?? subtotal + gst;

  return { subtotal, gst, total };
};

export const getOrderLineAmountBreakdown = (item, order = {}) => {
  const quantity = item.quantity || 1;
  const lineSubtotal = (Number(item.basePrice) || 0) * quantity;
  const lineRawGst = (Number(item.gstAmount) || 0) * quantity;
  const items = order.items || [];

  if (items.length === 1) {
    return getOrderAmountBreakdown(order);
  }

  const linePayable = buildPayableTotals({ subtotal: lineSubtotal, gstTotal: lineRawGst });
  const total = item.lineTotal ?? linePayable.total;

  return {
    subtotal: lineSubtotal,
    gst: total - lineSubtotal,
    total,
  };
};
