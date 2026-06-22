import { buildPayableTotals, roundMoney } from './money.js'

export const getOrderAmountBreakdown = (order = {}) => {
  const items = order.items || []

  const subtotalFromItems = items.reduce(
    (sum, item) => sum + (Number(item.basePrice) || 0) * (item.quantity || 1),
    0,
  )
  const gstFromItems = items.reduce(
    (sum, item) => sum + (Number(item.gstAmount) || 0) * (item.quantity || 1),
    0,
  )

  const hasOrderSubtotal = order.subtotalAmount != null && order.subtotalAmount > 0
  const hasOrderGst = order.gstAmount != null

  const subtotal = hasOrderSubtotal ? order.subtotalAmount : subtotalFromItems || order.totalAmount || 0
  const gst = hasOrderGst ? order.gstAmount : gstFromItems
  const discountAmount = Number(order.discountAmount) || 0
  const promoCode = order.promoCode || ''
  const taxableSubtotal = Math.max(0, roundMoney(subtotal - discountAmount))
  const total =
    order.totalAmount ??
    order.amount ??
    Math.max(0, taxableSubtotal + gst)

  return { subtotal, taxableSubtotal, gst, promoCode, discountAmount, total }
}

export const getOrderLineAmountBreakdown = (item, order = {}) => {
  const quantity = item.quantity || 1
  const lineSubtotal = (Number(item.basePrice) || 0) * quantity
  const lineGst = (Number(item.gstAmount) || 0) * quantity
  const total = item.lineTotal ?? roundMoney(lineSubtotal + lineGst)

  const orderSubtotal = Number(order.subtotalAmount) || 0
  const orderDiscount = Number(order.discountAmount) || 0
  const discountAmount =
    orderSubtotal > 0 ? roundMoney((orderDiscount * lineSubtotal) / orderSubtotal) : 0

  return {
    subtotal: lineSubtotal,
    discountAmount,
    gst: lineGst,
    promoCode: order.promoCode || '',
    total,
  }
}

export const applyPayableLineTotals = (orderItems, orderTotals) => {
  if (!orderItems.length) return orderItems

  const grossSubtotal = orderItems.reduce(
    (sum, item) => sum + (Number(item.basePrice) || 0) * item.quantity,
    0,
  )
  const discountAmount = Number(orderTotals.discountAmount) || 0

  const lines = orderItems.map((item) => {
    const lineSubtotal = roundMoney((Number(item.basePrice) || 0) * item.quantity)
    const lineDiscountShare =
      grossSubtotal > 0 ? roundMoney((discountAmount * lineSubtotal) / grossSubtotal) : 0
    const lineTaxable = Math.max(0, roundMoney(lineSubtotal - lineDiscountShare))
    const lineRawGst = roundMoney((lineTaxable * (Number(item.gstPercentage) || 0)) / 100)
    const linePayable = buildPayableTotals({ subtotal: lineTaxable, gstTotal: lineRawGst })
    const gstPerUnit = item.quantity ? roundMoney(lineRawGst / item.quantity) : lineRawGst

    return {
      ...item,
      gstAmount: gstPerUnit,
      lineTotal: linePayable.total,
    }
  })

  const sumLines = lines.reduce((sum, item) => sum + item.lineTotal, 0)
  const diff = roundMoney(orderTotals.total - sumLines)
  if (diff !== 0 && lines.length) {
    lines[lines.length - 1].lineTotal = roundMoney(lines[lines.length - 1].lineTotal + diff)
  }

  return lines
}
