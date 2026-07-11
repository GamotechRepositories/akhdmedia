export const getPaymentProvider = (order) =>
  String(order?.paymentProvider || 'razorpay').toLowerCase() === 'paypal' ? 'paypal' : 'razorpay'

export const getPaymentReferenceId = (order) => {
  if (getPaymentProvider(order) === 'paypal') {
    return order?.paypalCaptureId?.trim() || order?.paypalOrderId?.trim() || ''
  }

  return order?.razorpayPaymentId?.trim() || ''
}
