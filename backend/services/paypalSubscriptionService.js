import AppError from '../utils/AppError.js'
import { getAccessToken } from './paypalService.js'
import { getPayPalBaseUrl, isPayPalConfigured } from '../config/paypal.js'
import { fetchLiveUsdInrRate } from './exchangeRateService.js'
import UserSubscription from '../models/UserSubscription.js'
import User from '../models/User.js'

export const paypalSubscriptionsEnabled = () =>
  isPayPalConfigured() && Boolean(process.env.PAYPAL_WEBHOOK_ID?.trim())

export const paypalRequest = async (path, { method = 'GET', body, requestId } = {}) => {
  const token = await getAccessToken()
  const response = await fetch(`${getPayPalBaseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`, 'Content-Type': 'application/json',
      ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000),
  })
  const data = response.status === 204 ? {} : await response.json().catch(() => ({}))
  if (!response.ok) throw new AppError('PayPal could not complete this request. Please try again or contact support.', 502)
  return data
}

export const getPayPalFrequency = (plan) => {
  if (plan.interval === 'weekly') return { unit: 'WEEK', count: 1 }
  if (plan.interval === 'yearly') return { unit: 'YEAR', count: 1 }
  if (['days', 'custom'].includes(plan.interval)) {
    const count = Number(plan.durationDays)
    if (!Number.isInteger(count) || count < 1 || count > 365) {
      throw new AppError('PayPal custom billing periods must be between 1 and 365 days.', 400)
    }
    return { unit: 'DAY', count }
  }
  return { unit: 'MONTH', count: 1 }
}

export const createPayPalSubscription = async ({ subscription, plan }) => {
  if (!paypalSubscriptionsEnabled()) throw new AppError('PayPal autopay is not configured. Please contact support.', 503)
  if ((plan.currency || 'INR') !== 'INR') throw new AppError('PayPal subscriptions currently require INR store pricing.', 400)
  const frequency = getPayPalFrequency(plan)
  const { rate } = await fetchLiveUsdInrRate()
  const amount = Math.round(subscription.totalAmount / rate * 100) / 100
  if (amount < 0.01) throw new AppError('Plan amount is too low for PayPal.', 400)
  const requestId = subscription._id.toString()
  const product = await paypalRequest('/v1/catalogs/products', {
    method: 'POST', requestId: `product-${requestId}`,
    body: { name: plan.name.slice(0, 127), type: 'SERVICE', category: 'SOFTWARE' },
  })
  const billingPlan = await paypalRequest('/v1/billing/plans', {
    method: 'POST', requestId: `plan-${requestId}`,
    body: {
      product_id: product.id, name: plan.name.slice(0, 127), status: 'ACTIVE',
      billing_cycles: [{
        frequency: { interval_unit: frequency.unit, interval_count: frequency.count },
        tenure_type: 'REGULAR', sequence: 1, total_cycles: 0,
        pricing_scheme: { fixed_price: { value: amount.toFixed(2), currency_code: 'USD' } },
      }],
      payment_preferences: { auto_bill_outstanding: false, payment_failure_threshold: 1 },
    },
  })
  // Save the binding before a customer can approve or a webhook can arrive.
  subscription.paypalPlanId = billingPlan.id
  subscription.paypalAmount = amount
  subscription.paypalCurrency = 'USD'
  subscription.paypalFrequency = frequency
  await subscription.save()
  const frontend = (process.env.FRONTEND_URL || 'https://akhdmedia.com').split(',')[0].trim().replace(/\/$/, '')
  const returnUrl = new URL(`${frontend}/subscriptions/checkout`)
  returnUrl.searchParams.set('planId', plan._id.toString())
  returnUrl.searchParams.set('paypalSubscription', requestId)
  const cancelUrl = new URL(`${frontend}/subscriptions/checkout`)
  cancelUrl.searchParams.set('planId', plan._id.toString())
  cancelUrl.searchParams.set('paypalCancelled', '1')
  const remote = await paypalRequest('/v1/billing/subscriptions', {
    method: 'POST', requestId: `sub-${requestId}`,
    body: {
      plan_id: billingPlan.id, custom_id: requestId,
      application_context: {
        brand_name: 'AKHD Media', shipping_preference: 'NO_SHIPPING', user_action: 'SUBSCRIBE_NOW',
        return_url: returnUrl.toString(), cancel_url: cancelUrl.toString(),
      },
    },
  })
  subscription.paypalSubscriptionId = remote.id
  await subscription.save()
  const approvalUrl = remote.links?.find(link => link.rel === 'approve')?.href
  if (!approvalUrl) throw new AppError('PayPal approval is unavailable.', 502)
  return { subscriptionId: remote.id, approvalUrl, amount, currency: 'USD', frequency }
}

export const advancePayPalPeriod = (date, frequency) => {
  const end = new Date(date)
  const day = end.getUTCDate()
  if (frequency.unit === 'DAY' || frequency.unit === 'WEEK') {
    end.setUTCDate(day + frequency.count * (frequency.unit === 'WEEK' ? 7 : 1))
  } else {
    end.setUTCDate(1)
    end.setUTCMonth(end.getUTCMonth() + frequency.count * (frequency.unit === 'YEAR' ? 12 : 1))
    const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate()
    end.setUTCDate(Math.min(day, lastDay))
  }
  return end
}

export const reconcilePayPalSubscription = async (subscription) => {
  const remoteId = subscription.paypalSubscriptionId
  if (!remoteId) throw new AppError('PayPal subscription is not ready. Please retry.', 409)
  const path = `/v1/billing/subscriptions/${encodeURIComponent(remoteId)}`
  const remote = await paypalRequest(path)
  if (remote.custom_id !== String(subscription._id) || remote.plan_id !== subscription.paypalPlanId) {
    throw new AppError('PayPal subscription does not match this purchase.', 400)
  }
  // Only completed transactions grant access; mandate approval alone does not.
  const end = new Date()
  const start = new Date(end.getTime() - 31 * 86400000)
  const query = new URLSearchParams({ start_time: start.toISOString(), end_time: end.toISOString() })
  const result = await paypalRequest(`${path}/transactions?${query}`)
  const payment = (result.transactions || [])
    .filter(t => t.status === 'COMPLETED' && t.amount_with_breakdown?.gross_amount?.currency_code === subscription.paypalCurrency &&
      Number(t.amount_with_breakdown.gross_amount.value) === subscription.paypalAmount)
    .sort((a, b) => new Date(b.time) - new Date(a.time))[0]
  if (payment) {
    const paidAt = new Date(payment.time)
    const periodEnd = advancePayPalPeriod(paidAt, subscription.paypalFrequency)
    if (!Number.isFinite(paidAt.getTime())) throw new AppError('Invalid PayPal payment date.', 502)
    const updated = await UserSubscription.findOneAndUpdate({
      _id: subscription._id,
      $or: [{ paypalLastPaymentAt: null }, { paypalLastPaymentAt: { $lt: paidAt } }],
    }, { $set: {
      paypalLastPaymentAt: paidAt, paypalLastPaymentId: payment.id,
      status: periodEnd > end ? 'active' : 'expired', paymentStatus: 'paid',
      startDate: paidAt, endDate: periodEnd, amountPaid: subscription.totalAmount,
      videoQuotaRemaining: subscription.videoQuota,
    }, $inc: { currentCycle: subscription.paypalLastPaymentAt ? 1 : 0 } }, { new: true })
    if (updated && periodEnd > end) await User.findByIdAndUpdate(subscription.userId, { isPremium: true })
  }
  if (['CANCELLED', 'EXPIRED'].includes(remote.status)) {
    await UserSubscription.updateOne({ _id: subscription._id }, { $set: { cancelAtPeriodEnd: true, cancelledAt: new Date() } })
  }
  return UserSubscription.findById(subscription._id)
}

export const verifyPayPalSubscription = async ({ userId, subscriptionId }) => {
  const subscription = await UserSubscription.findOne({ _id: subscriptionId, userId, paymentProvider: 'paypal' })
  if (!subscription) throw new AppError('Subscription not found.', 404)
  const updated = await reconcilePayPalSubscription(subscription)
  if (updated.paymentStatus !== 'paid' || updated.status !== 'active') {
    throw new AppError('PayPal payment is still pending. Please retry shortly.', 409)
  }
  return updated
}

export const cancelPayPalSubscription = async (id) => {
  const path = `/v1/billing/subscriptions/${encodeURIComponent(id)}`
  const remote = await paypalRequest(path)
  if (['CANCELLED', 'EXPIRED'].includes(remote.status)) return
  await paypalRequest(`${path}/cancel`, { method: 'POST', body: { reason: 'Customer cancelled automatic renewal' } })
}

export const processPayPalWebhook = async (headers, event) => {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim()
  if (!webhookId) throw new AppError('PayPal webhook is not configured.', 503)
  const required = ['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time']
  if (required.some(key => !headers[key])) throw new AppError('Missing PayPal signature.', 400)
  const verification = await paypalRequest('/v1/notifications/verify-webhook-signature', {
    method: 'POST', body: {
      auth_algo: headers['paypal-auth-algo'], cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'], transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'], webhook_id: webhookId, webhook_event: event,
    },
  })
  if (verification.verification_status !== 'SUCCESS') throw new AppError('Invalid PayPal signature.', 400)
  const supported = ['PAYMENT.SALE.COMPLETED', 'BILLING.SUBSCRIPTION.ACTIVATED', 'BILLING.SUBSCRIPTION.CANCELLED', 'BILLING.SUBSCRIPTION.EXPIRED', 'BILLING.SUBSCRIPTION.SUSPENDED', 'BILLING.SUBSCRIPTION.PAYMENT.FAILED']
  if (!supported.includes(event.event_type)) return
  const id = event.event_type === 'PAYMENT.SALE.COMPLETED' ? event.resource?.billing_agreement_id : event.resource?.id
  if (!id) return
  const subscription = await UserSubscription.findOne({ paypalSubscriptionId: id, paymentProvider: 'paypal' })
  if (subscription) await reconcilePayPalSubscription(subscription)
}
