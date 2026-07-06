const PAYPAL_SCRIPT_ID = 'paypal-sdk-script'

export const loadPayPalScript = (clientId, currency = 'INR') =>
  new Promise((resolve) => {
    if (!clientId) {
      resolve(false)
      return
    }

    const sdkCurrency = encodeURIComponent(currency || 'INR')
    const sdkUrl = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${sdkCurrency}&intent=capture`

    if (window.paypal && window.__paypalSdkUrl === sdkUrl) {
      resolve(true)
      return
    }

    const existing = document.getElementById(PAYPAL_SCRIPT_ID)
    if (existing) {
      existing.remove()
      delete window.paypal
    }

    const script = document.createElement('script')
    script.id = PAYPAL_SCRIPT_ID
    script.src = sdkUrl
    script.async = true
    script.onload = () => {
      window.__paypalSdkUrl = sdkUrl
      resolve(Boolean(window.paypal))
    }
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

export const renderPayPalButtons = async ({
  clientId,
  currency = 'INR',
  containerId,
  paypalOrderId,
  onApprove,
  onCancel,
  onError,
}) => {
  const loaded = await loadPayPalScript(clientId, currency)
  if (!loaded || !window.paypal) {
    throw new Error('Failed to load PayPal. Please try again.')
  }

  const container = document.getElementById(containerId)
  if (!container) {
    throw new Error('PayPal container not found')
  }

  container.innerHTML = ''

  return window.paypal.Buttons({
    style: {
      layout: 'vertical',
      color: 'blue',
      shape: 'rect',
      label: 'paypal',
    },
    createOrder: () => paypalOrderId,
    onApprove: async (data) => {
      await onApprove(data.orderID)
    },
    onCancel: () => {
      onCancel?.()
    },
    onError: (error) => {
      onError?.(error)
    },
  }).render(`#${containerId}`)
}
