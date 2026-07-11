import { BRAND } from '../config/brand.js'
import { getOrderAmountBreakdown } from '../utils/orderAmounts.js'
import { getPaymentReferenceId } from '../utils/paymentReference.js'
import { generateLicenseCertificateBuffer } from '../utils/licenseCertificatePdf.js'

const formatCurrencyForPdf = (amount) => {
  if (!amount || amount <= 0) return 'Price on request'
  return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`
}

const mapOrderItemsForCertificate = (items = []) =>
  items.map((item) => ({
    name: item.name,
    clipId: item.clipId,
    imageSize: item.imageSize,
    licenseNumber: item.licenseNumber,
  }))

export const getLicenseCertificateFilename = (order) => {
  const orderNumber = order.orderNumber?.slice(-8).toUpperCase() || 'certificate'
  return `license-certificate-${orderNumber}.pdf`
}

const getOrderTransactionId = (order) => getPaymentReferenceId(order)

export const buildLicenseCertificateBuffer = (order, downloads = null) => {
  const items = downloads ?? order.items ?? []
  const { subtotal, gst, total, promoCode, discountAmount } = getOrderAmountBreakdown(order)
  const gstPercent = subtotal > 0 ? Math.round((gst / subtotal) * 100) : 18
  const orderNumber = order.orderNumber?.slice(-8).toUpperCase() || '--------'
  const orderDateLabel = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return generateLicenseCertificateBuffer({
    brandName: BRAND.name,
    orderNumber,
    transactionId: getOrderTransactionId(order),
    orderDateLabel,
    customerName: order.billingAddress?.name || '',
    customerEmail: order.billingAddress?.email || '',
    subtotalLabel: formatCurrencyForPdf(subtotal),
    gstLabel: formatCurrencyForPdf(gst),
    promoCodeLabel: promoCode || '',
    promoDiscountLabel: discountAmount > 0 ? formatCurrencyForPdf(discountAmount) : '',
    orderTotalLabel: formatCurrencyForPdf(total),
    gstPercent,
    orderItems: mapOrderItemsForCertificate(items),
  })
}
