import AppError from '../utils/AppError.js'
import { convertInrAmountForPayPal } from './exchangeRateService.js'
import {
  getPayPalBaseUrl,
  getPayPalCancelUrl,
  getPayPalMode,
  getPayPalReturnUrl,
  isPayPalConfigured,
} from '../config/paypal.js'

export { isPayPalConfigured, getPayPalClientId } from '../config/paypal.js'

const getAccessToken = async () => {
  if (!isPayPalConfigured()) {
    throw new AppError('PayPal is not configured. Please contact support.', 503)
  }

  const clientId = process.env.PAYPAL_CLIENT_ID.trim()
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET.trim()
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error('[paypal] OAuth failed:', data, `(mode=${getPayPalMode()}, api=${getPayPalBaseUrl()})`)
    const hint =
      getPayPalMode() === 'live'
        ? 'Check that PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are your Live REST API credentials from developer.paypal.com.'
        : 'Check sandbox credentials, or set PAYPAL_MODE=live (or production) for live keys.'
    throw new AppError(`PayPal authentication failed. ${hint}`, 503)
  }

  return data.access_token
}

export const createPayPalOrder = async ({
  amount,
  orderId,
  orderNumber,
  returnUrl = getPayPalReturnUrl(),
  cancelUrl = getPayPalCancelUrl(),
}) => {
  const { currency, amount: chargeAmount, usdInrRate, rateSource } =
    await convertInrAmountForPayPal(amount)

  if (!Number.isFinite(chargeAmount) || chargeAmount <= 0) {
    throw new AppError('Order total is too low for PayPal payment', 400)
  }

  const token = await getAccessToken()
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: orderId,
          description: `Order ${orderNumber}`,
          amount: {
            currency_code: currency,
            value: chargeAmount.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'AKHD Media',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error('[paypal] create order failed:', data)
    throw new AppError(data.message || 'Failed to create PayPal order', 400)
  }

  const approvalUrl = data.links?.find((link) => link.rel === 'approve')?.href || ''
  if (!approvalUrl) {
    throw new AppError('PayPal approval URL is unavailable', 503)
  }

  return {
    id: data.id,
    approvalUrl,
    status: data.status,
    currency,
    amount: chargeAmount,
    inrAmount: Number(amount),
    usdInrRate,
    rateSource,
  }
}

export const capturePayPalOrder = async (paypalOrderId) => {
  if (!paypalOrderId?.trim()) {
    throw new AppError('Missing PayPal order ID', 400)
  }

  const token = await getAccessToken()
  const response = await fetch(
    `${getPayPalBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  )

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    console.error('[paypal] capture failed:', data)
    throw new AppError(data.message || 'PayPal capture failed', 400)
  }

  const capture = data.purchase_units?.[0]?.payments?.captures?.[0]
  const captureStatus = capture?.status || data.status || ''

  if (!['COMPLETED', 'APPROVED'].includes(captureStatus) && data.status !== 'COMPLETED') {
    throw new AppError('PayPal payment was not completed', 400)
  }

  return {
    id: data.id,
    status: data.status,
    captureId: capture?.id || '',
    captureStatus,
  }
}
