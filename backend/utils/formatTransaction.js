import { getPaymentProvider, getPaymentReferenceId } from './paymentReference.js'

export const getTransactionStatus = (order) => {
  if (order.paymentStatus === 'paid' || order.paymentStatus === 'invoice') {
    return {
      status: 'successful',
      label: 'Successful',
      isSuccessful: true,
    }
  }

  if (order.paymentStatus === 'failed') {
    return {
      status: 'failed',
      label: 'Failed',
      isSuccessful: false,
    }
  }

  if (order.paymentStatus === 'pending') {
    return {
      status: 'pending',
      label: 'Pending',
      isSuccessful: false,
    }
  }

  return {
    status: order.paymentStatus || 'unknown',
    label: order.paymentStatus || 'Unknown',
    isSuccessful: false,
  }
}

export const formatTransactionResponse = (order) => {
  const txnStatus = getTransactionStatus(order)

  return {
    id: order._id.toString(),
    transactionId: getPaymentReferenceId(order),
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    paymentProvider: getPaymentProvider(order),
    razorpayOrderId: order.razorpayOrderId || '',
    razorpayPaymentId: order.razorpayPaymentId || '',
    paypalOrderId: order.paypalOrderId || '',
    paypalCaptureId: order.paypalCaptureId || '',
    customerName: order.billingAddress?.name || '',
    customerEmail: order.billingAddress?.email || '',
    customerPhone: order.billingAddress?.phone || '',
    purchaseReasons: order.billingAddress?.purchaseReasons || [],
    purchaseReasonOther: order.billingAddress?.purchaseReasonOther || '',
    amount: order.totalAmount,
    subtotalAmount: order.subtotalAmount ?? 0,
    gstAmount: order.gstAmount ?? 0,
    promoCode: order.promoCode || '',
    discountAmount: order.discountAmount ?? 0,
    totalAmount: order.totalAmount,
    currency: 'INR',
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus || '',
    transactionStatus: txnStatus.status,
    transactionStatusLabel: txnStatus.label,
    isSuccessful: txnStatus.isSuccessful,
    orderStatus: order.status,
    itemCount: order.items?.length || 0,
    items: order.items || [],
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}


export const formatSubscriptionTransactionResponse = (sub) => {
  const isPaid = sub.paymentStatus === 'paid' || sub.status === 'active'
  const isFailed = sub.status === 'cancelled' || sub.paymentStatus === 'failed'

  const amount = Number(sub.amountPaid ?? sub.totalAmount ?? sub.price ?? 0)
  const subtotal = Number(sub.subtotal ?? sub.planSnapshot?.subtotal ?? sub.price ?? 0)
  const gstAmount = Number(sub.gstAmount ?? sub.planSnapshot?.gstAmount ?? 0)
  const planName = sub.planSnapshot?.name || sub.planId?.name || 'Subscription Plan'
  const interval = sub.planSnapshot?.interval || sub.planId?.interval || 'monthly'
  const idStr = sub._id.toString()

  let txnStatus = 'pending'
  let txnLabel = 'Pending'
  if (isPaid) {
    txnStatus = 'successful'
    txnLabel = 'Successful'
  } else if (isFailed) {
    txnStatus = 'failed'
    txnLabel = 'Failed'
  }

  return {
    id: idStr,
    transactionId: sub.razorpayPaymentId || sub.razorpaySubscriptionId || idStr,
    orderId: idStr,
    orderNumber: `SUB-${idStr.slice(-8).toUpperCase()}`,
    type: 'subscription',
    paymentProvider: sub.paymentProvider || 'razorpay',
    razorpayOrderId: sub.razorpayOrderId || '',
    razorpayPaymentId: sub.razorpayPaymentId || '',
    razorpaySubscriptionId: sub.razorpaySubscriptionId || '',
    paypalOrderId: '',
    paypalCaptureId: '',
    customerName: sub.userId?.name || 'Subscriber',
    customerEmail: sub.userId?.email || '',
    customerPhone: sub.whatsappNumber || sub.userId?.phone || '',
    purchaseReasons: ['subscription'],
    purchaseReasonOther: '',
    amount,
    subtotalAmount: subtotal,
    gstAmount,
    promoCode: '',
    discountAmount: 0,
    totalAmount: amount,
    currency: sub.currency || 'INR',
    paymentMethod: sub.paymentProvider || 'razorpay',
    paymentStatus: sub.paymentStatus || (isPaid ? 'paid' : 'pending'),
    transactionStatus: txnStatus,
    transactionStatusLabel: txnLabel,
    isSuccessful: isPaid,
    orderStatus: sub.status || 'active',
    itemCount: 1,
    items: [
      {
        name: `${planName} (${interval})`,
        clipId: 'SUBSCRIPTION',
        price: amount,
        licenseNumber: `SUB-LIC-${idStr.slice(-6).toUpperCase()}`,
      },
    ],
    createdAt: sub.createdAt || sub.startDate || new Date(),
    updatedAt: sub.updatedAt || sub.startDate || new Date(),
  }
}
