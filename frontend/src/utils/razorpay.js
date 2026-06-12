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

const isMobileDevice = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

const METHOD_PRESETS = {
  upi: {
    upi: true,
    card: false,
    netbanking: false,
    wallet: false,
    paylater: false,
    emi: false,
  },
  card: {
    upi: false,
    card: true,
    netbanking: false,
    wallet: false,
    paylater: false,
    emi: false,
  },
  netbanking: {
    upi: false,
    card: false,
    netbanking: true,
    wallet: false,
    paylater: false,
    emi: false,
  },
}

export const openRazorpayCheckout = async ({
  key,
  amount,
  currency,
  orderId,
  name,
  description,
  prefill,
  preferredMethod = 'upi',
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
      method: METHOD_PRESETS[preferredMethod] || METHOD_PRESETS.upi,
      ...(isMobileDevice() && preferredMethod === 'upi' ? { webview_intent: true } : {}),
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
