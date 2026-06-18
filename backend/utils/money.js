export const roundMoney = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100

/** Final payable amount is always rounded up to the nearest rupee (e.g. 588.82 → 589). */
export const roundUpPayableAmount = (value) => Math.ceil(roundMoney(value))

export const buildPayableTotals = ({ subtotal = 0, gstTotal: rawGstTotal = 0 } = {}) => {
  const normalizedSubtotal = roundMoney(subtotal)
  const gstTotal = roundUpPayableAmount(rawGstTotal)

  return {
    subtotal: normalizedSubtotal,
    gstTotal,
    total: normalizedSubtotal + gstTotal,
  }
}
