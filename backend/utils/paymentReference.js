export const getPaymentProvider = (order) => {
  const provider = String(order?.paymentProvider || 'razorpay').toLowerCase()
  if (provider === 'paypal') return 'paypal'
  if (provider === 'apple') return 'apple'
  return 'razorpay'
}

export const getPaymentReferenceId = (order) => {
  const provider = getPaymentProvider(order)
  if (provider === 'paypal') {
    return order?.paypalCaptureId?.trim() || order?.paypalOrderId?.trim() || ''
  }
  if (provider === 'apple') {
    return order?.appleTransactionId?.trim() || ''
  }

  return order?.razorpayPaymentId?.trim() || ''
}
