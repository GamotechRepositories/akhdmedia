export const getPayPalMode = () => {
  const mode = (process.env.PAYPAL_MODE || 'sandbox').trim().toLowerCase()
  if (['live', 'production', 'prod'].includes(mode)) return 'live'
  return 'sandbox'
}

export const getPayPalBaseUrl = () =>
  getPayPalMode() === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

export const isPayPalConfigured = () =>
  Boolean(process.env.PAYPAL_CLIENT_ID?.trim() && process.env.PAYPAL_CLIENT_SECRET?.trim())

export const getPayPalClientId = () => process.env.PAYPAL_CLIENT_ID?.trim() || ''

export const getPayPalCurrency = () => process.env.PAYPAL_CURRENCY?.trim().toUpperCase() || 'INR'

/** Fallback only — live rate is fetched in exchangeRateService. */
export const getPayPalUsdInrRate = () => {
  const rate = Number(process.env.PAYPAL_USD_INR_RATE)
  if (!Number.isFinite(rate) || rate <= 0) return 84
  return rate
}

export const getPayPalReturnUrl = () => {
  const configured = process.env.PAYPAL_RETURN_URL?.trim()
  if (configured) return configured

  const frontend = (process.env.FRONTEND_URL || '').split(',')[0]?.trim()
  if (frontend) return `${frontend.replace(/\/$/, '')}/paypal/complete`
  return 'https://akhdmedia.com/paypal/complete'
}

export const getPayPalCancelUrl = () => {
  const configured = process.env.PAYPAL_CANCEL_URL?.trim()
  if (configured) return configured

  const frontend = (process.env.FRONTEND_URL || '').split(',')[0]?.trim()
  if (frontend) return `${frontend.replace(/\/$/, '')}/checkout`
  return 'https://akhdmedia.com/checkout'
}
