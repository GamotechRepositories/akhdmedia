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
    transactionId: order.razorpayPaymentId || '',
    orderId: order._id.toString(),
    orderNumber: order.orderNumber,
    razorpayOrderId: order.razorpayOrderId || '',
    razorpayPaymentId: order.razorpayPaymentId || '',
    customerName: order.billingAddress?.name || '',
    customerEmail: order.billingAddress?.email || '',
    customerPhone: order.billingAddress?.phone || '',
    purchaseReasons: order.billingAddress?.purchaseReasons || [],
    amount: order.totalAmount,
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
