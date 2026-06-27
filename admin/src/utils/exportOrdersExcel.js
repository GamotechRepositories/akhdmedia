import * as XLSX from 'xlsx'
import { getOrderAmountBreakdown, getOrderLineAmountBreakdown } from './orderAmounts'

const PURCHASE_REASON_LABELS = {
  personal: 'Personal collection',
  digital: 'Digital media',
  outlet: 'Media agency',
  other: 'Other',
}

const shortOrderNumber = (orderNumber = '') => orderNumber.slice(-8).toUpperCase()

const formatPurchaseReasons = (billingAddress = {}) => {
  const reasons = billingAddress.purchaseReasons || []
  if (!reasons.length) return ''

  return reasons
    .map((reason) => {
      if (reason === 'other' && billingAddress.purchaseReasonOther?.trim()) {
        return `Other: ${billingAddress.purchaseReasonOther.trim()}`
      }
      return PURCHASE_REASON_LABELS[reason] || reason
    })
    .join(', ')
}

const formatExportDate = (value) => {
  if (!value) return ''
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const roundInr = (amount = 0) => Math.round(Number(amount) || 0)

const joinValues = (items = [], getter) =>
  items
    .map(getter)
    .filter((value) => value !== '' && value != null)
    .join(' | ')

const formatPurchasedItems = (order) => {
  const items = order.items || []
  if (!items.length) return ''

  return items
    .map((item, index) => {
      const line = getOrderLineAmountBreakdown(item, order)
      const parts = [
        `Qty ${item.quantity ?? 1}`,
        item.name ? `Product ${item.name}` : '',
        item.clipId ? `Clip ${item.clipId}` : '',
        item.imageSize ? `Tier ${item.imageSize}` : '',
        item.licenseNumber ? `License ${item.licenseNumber}` : '',
        item.brand ? `Brand ${item.brand}` : '',
        `Line total ₹${roundInr(line.total)}`,
      ].filter(Boolean)

      return `${index + 1}) ${parts.join(' | ')}`
    })
    .join('\n')
}

const buildOrderRows = (orders = []) =>
  orders.map((order, index) => {
    const billing = order.billingAddress || {}
    const amounts = getOrderAmountBreakdown(order)
    const items = order.items || []
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0)

    return {
      '#': index + 1,
      Order: order.orderNumber ? `#${shortOrderNumber(order.orderNumber)}` : '',
      'Full order number': order.orderNumber || '',
      'Order ID': order.id || '',
      Date: formatExportDate(order.createdAt),
      Status: order.status || '',
      Payment: 'Online',
      'Payment status': order.paymentStatus || '',
      'Customer name': billing.name || '',
      'Customer email': billing.email || '',
      'Customer phone': billing.phone || '',
      'Purchase reasons': formatPurchaseReasons(billing),
      'Subtotal (INR)': roundInr(amounts.subtotal),
      'Promo code': amounts.promoCode || '',
      'Promo discount (INR)': roundInr(amounts.discountAmount),
      'Taxable subtotal (INR)': roundInr(amounts.taxableSubtotal),
      'GST (INR)': roundInr(amounts.gst),
      'Total (INR)': roundInr(amounts.total),
      'Product lines': items.length,
      'Total quantity': totalQuantity,
      'Product names': joinValues(items, (item) => item.name),
      Quantities: joinValues(items, (item) => String(item.quantity ?? 1)),
      'Clip IDs': joinValues(items, (item) => item.clipId),
      'License tiers': joinValues(items, (item) => item.imageSize),
      'License numbers': joinValues(items, (item) => item.licenseNumber),
      Brands: joinValues(items, (item) => item.brand),
      'Product IDs': joinValues(items, (item) => item.productId),
      'Purchased items detail': formatPurchasedItems(order),
      'Razorpay order ID': order.razorpayOrderId || '',
      'Razorpay payment ID': order.razorpayPaymentId || '',
      'Last updated': formatExportDate(order.updatedAt),
    }
  })

const setColumnWidths = (worksheet, widths = []) => {
  worksheet['!cols'] = widths.map((wch) => ({ wch }))
}

export const downloadOrdersExcel = (orders = [], { scope = 'all' } = {}) => {
  const rows = buildOrderRows(orders)
  const worksheet = XLSX.utils.json_to_sheet(rows)

  setColumnWidths(worksheet, [
    5, 12, 22, 26, 20, 12, 10, 14, 24, 30, 16, 28, 14, 14, 16, 18, 12, 12, 10, 12, 32, 16, 28, 22,
    28, 18, 14, 24, 48, 24, 24, 20,
  ])

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders')

  const date = new Date().toISOString().slice(0, 10)
  const suffix = scope === 'filtered' ? 'filtered' : 'all'
  XLSX.writeFile(workbook, `akhdmedia-orders-${suffix}-${date}.xlsx`)
}
