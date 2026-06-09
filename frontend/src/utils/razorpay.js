export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

export const openRazorpayCheckout = async ({
  key,
  amount,
  currency,
  orderId,
  name,
  description,
  prefill,
  onSuccess,
  onDismiss,
}) => {
  const loaded = await loadRazorpayScript()
  if (!loaded) {
    throw new Error('Failed to load payment gateway. Please try again.')
  }

  return new Promise((resolve, reject) => {
    const options = {
      key,
      amount,
      currency,
      name,
      description,
      order_id: orderId,
      prefill,
      theme: { color: '#111827' },
      handler: async (response) => {
        try {
          const result = await onSuccess(response)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      },
      modal: {
        ondismiss: () => {
          onDismiss?.()
          reject(new Error('Payment cancelled'))
        },
      },
    }

    const razorpay = new window.Razorpay(options)
    razorpay.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed'))
    })
    razorpay.open()
  })
}
