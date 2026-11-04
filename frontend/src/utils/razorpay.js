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
  wallet: {
    upi: false,
    card: false,
    netbanking: false,
    wallet: true,
    paylater: false,
    emi: false,
  },
  emi: {
    upi: false,
    card: false,
    netbanking: false,
    wallet: false,
    paylater: false,
    emi: true,
  },
}

export const openRazorpayCheckout = async ({
  key,
  amount,
  currency,
  orderId,
  subscriptionId,
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
      name,
      description,
      prefill,
      theme: { color: '#111827' },
      ...((preferredMethod && METHOD_PRESETS[preferredMethod]) ? { method: METHOD_PRESETS[preferredMethod] } : {}),
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

    if (subscriptionId) {
      options.subscription_id = subscriptionId
    }
    if (orderId) {
      options.order_id = orderId
    }
    if (amount) {
      options.amount = amount
    }
    if (currency) {
      options.currency = currency
    }

    const razorpay = new window.Razorpay(options)
    razorpay.on('payment.failed', (response) => {
      reject(new Error(response.error?.description || 'Payment failed'))
    })
    razorpay.open()
  })
}
