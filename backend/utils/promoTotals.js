import { buildPayableTotals, roundMoney } from './money.js'

export const normalizePricingLines = (items = []) =>
  items.map((item) => ({
    basePrice: Number(item.basePrice ?? item.price ?? 0),
    quantity: Number(item.quantity) || 1,
    gstPercentage: Number(item.gstPercentage ?? 0),
  }))

export const buildPromoAdjustedTotals = (items = [], discountAmount = 0) => {
  const lines = normalizePricingLines(items)
  const grossSubtotal = roundMoney(
    lines.reduce((sum, line) => sum + line.basePrice * line.quantity, 0),
  )
  const discount = roundMoney(Math.min(grossSubtotal, Number(discountAmount) || 0))
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)

  if (grossSubtotal <= 0) {
    return {
      subtotal: 0,
      discountAmount: 0,
      taxableSubtotal: 0,
      gstTotal: 0,
      total: 0,
      itemCount,
    }
  }

  const adjustedLines = lines.map((line) => {
    const lineSubtotal = roundMoney(line.basePrice * line.quantity)
    const lineDiscountShare = roundMoney((discount * lineSubtotal) / grossSubtotal)
    const lineTaxable = Math.max(0, roundMoney(lineSubtotal - lineDiscountShare))
    const lineRawGst = roundMoney((lineTaxable * line.gstPercentage) / 100)

    return {
      lineSubtotal,
      lineDiscountShare,
      lineTaxable,
      lineRawGst,
      quantity: line.quantity,
      gstPercentage: line.gstPercentage,
    }
  })

  const taxableSubtotal = roundMoney(
    adjustedLines.reduce((sum, line) => sum + line.lineTaxable, 0),
  )
  const rawGstTotal = adjustedLines.reduce((sum, line) => sum + line.lineRawGst, 0)
  const payable = buildPayableTotals({ subtotal: taxableSubtotal, gstTotal: rawGstTotal })

  return {
    subtotal: grossSubtotal,
    discountAmount: discount,
    taxableSubtotal: payable.subtotal,
    gstTotal: payable.gstTotal,
    total: payable.total,
    itemCount,
    adjustedLines,
  }
}
