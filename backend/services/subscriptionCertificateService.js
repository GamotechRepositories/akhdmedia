import { BRAND } from '../config/brand.js'
import { generateSubscriptionCertificateBuffer } from '../utils/subscriptionCertificatePdf.js'

const formatCurrencyForPdf = (amount) => {
  if (!amount || amount <= 0) return 'Free'
  return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`
}

export const getSubscriptionCertificateFilename = (subscription) => {
  const subNumber = subscription._id?.toString().slice(-8).toUpperCase() || 'RECEIPT'
  return `subscription-tax-invoice-SUB-${subNumber}.pdf`
}

export const buildSubscriptionCertificateBuffer = (subscription, user = null) => {
  const subNumber = subscription._id?.toString().slice(-8).toUpperCase() || '--------'
  const planName = subscription.planSnapshot?.name || subscription.planId?.name || 'Editorial Subscription Plan'
  const interval = subscription.planSnapshot?.interval || subscription.planId?.interval || 'monthly'
  const videoQuota = subscription.videoQuota ?? subscription.planSnapshot?.videoQuota ?? 20

  const subtotal = Number(subscription.subtotal ?? subscription.planSnapshot?.subtotal ?? subscription.price ?? 0)
  const gst = Number(subscription.gstAmount ?? subscription.planSnapshot?.gstAmount ?? 0)
  const total = Number(subscription.totalAmount ?? subscription.planSnapshot?.totalPayable ?? (subtotal + gst))
  const gstPercent = Number(subscription.gstPercentage ?? subscription.planSnapshot?.gstPercentage ?? 18)

  const customerName = user?.name || subscription.userId?.name || subscription.planSnapshot?.customerName || 'Valued Subscriber'
  const customerEmail = user?.email || subscription.userId?.email || ''
  const whatsappNumber = subscription.whatsappNumber || user?.phone || ''

  const startDateLabel = new Date(subscription.startDate || subscription.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const endDateLabel = subscription.endDate
    ? new Date(subscription.endDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''

  const transactionId =
    subscription.razorpayPaymentId ||
    subscription.razorpaySubscriptionId ||
    subscription.paymentProvider ||
    'SUB-PAID'

  return generateSubscriptionCertificateBuffer({
    brandName: BRAND.name,
    subNumber,
    transactionId,
    orderDateLabel: startDateLabel,
    endDateLabel,
    customerName,
    customerEmail,
    whatsappNumber,
    planName,
    interval,
    videoQuota,
    subtotalLabel: formatCurrencyForPdf(subtotal),
    gstLabel: formatCurrencyForPdf(gst),
    orderTotalLabel: formatCurrencyForPdf(total),
    gstPercent,
  })
}

