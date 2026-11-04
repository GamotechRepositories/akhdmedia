import crypto from 'crypto'
import Razorpay from 'razorpay'
import AppError from '../utils/AppError.js'
import { isPayPalConfigured, getPayPalClientId } from './paypalService.js'
import { getPayPalCurrency, getPayPalMode } from '../config/paypal.js'
import { fetchLiveUsdInrRate } from './exchangeRateService.js'

export const isRazorpayConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID?.trim() && process.env.RAZORPAY_KEY_SECRET?.trim())

export { isPayPalConfigured, getPayPalClientId }

const getRazorpayClient = () => {
  if (!isRazorpayConfigured()) {
    throw new AppError('Online payment is not configured. Please contact support.', 503)
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

export const getRazorpayKeyId = () => {
  if (!isRazorpayConfigured()) {
    throw new AppError('Online payment is not configured. Please contact support.', 503)
  }
  return process.env.RAZORPAY_KEY_ID
}

export const getPaymentProvidersConfig = async () => {
  const { rate, source } = await fetchLiveUsdInrRate()

  return {
    currency: 'INR',
    razorpay: {
      enabled: isRazorpayConfigured(),
      keyId: isRazorpayConfigured() ? process.env.RAZORPAY_KEY_ID : '',
    },
    paypal: {
      enabled: isPayPalConfigured(),
      clientId: isPayPalConfigured() ? getPayPalClientId() : '',
      mode: getPayPalMode(),
      currency: getPayPalCurrency(),
      usdInrRate: rate,
      usdInrRateSource: source,
    },
  }
}

export const createRazorpayOrder = async ({ amount, receipt, notes = {} }) => {
  const razorpay = getRazorpayClient()
  const amountPaise = Math.round(Number(amount) * 100)

  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    throw new AppError('Order total must be at least ₹1 for online payment', 400)
  }

  return razorpay.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt,
    notes,
  })
}

export const verifyRazorpaySignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    throw new AppError('Online payment is not configured. Please contact support.', 503)
  }

  const body = `${razorpayOrderId}|${razorpayPaymentId}`
  const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex')
  return expectedSignature === razorpaySignature
}

export const canAccessOrderDownloads = (order) => {
  if (order.paymentStatus === 'paid' || order.paymentStatus === 'invoice') return true
  if (!order.paymentStatus && order.status === 'confirmed') return true
  return false
}


export const createRazorpayPlan = async ({ period = 'monthly', interval = 1, name, amount, currency = 'INR', description = '' }) => {
  const razorpay = getRazorpayClient()
  return razorpay.plans.create({
    period,
    interval: Number(interval) || 1,
    item: {
      name: String(name).slice(0, 40),
      amount: Math.round(Number(amount) * 100),
      currency: currency || 'INR',
      description: String(description || name).slice(0, 100),
    },
  })
}

export const createRazorpaySubscription = async ({ planId, totalCount = 60, customerNotify = 1, notes = {} }) => {
  const razorpay = getRazorpayClient()
  return razorpay.subscriptions.create({
    plan_id: planId,
    total_count: Number(totalCount) || 60,
    quantity: 1,
    customer_notify: customerNotify ? 1 : 0,
    notes,
  })
}

export const cancelRazorpaySubscription = async (subscriptionId, cancelAtCycleEnd = true) => {
  const razorpay = getRazorpayClient()
  return razorpay.subscriptions.cancel(subscriptionId, Boolean(cancelAtCycleEnd))
}

export const verifyRazorpaySubscriptionSignature = ({ razorpayPaymentId, razorpaySubscriptionId, razorpaySignature }) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) {
    throw new AppError('Online payment is not configured. Please contact support.', 503)
  }

  const body = `${razorpayPaymentId}|${razorpaySubscriptionId}`
  const expectedSignature = crypto.createHmac('sha256', keySecret).update(body).digest('hex')
  return expectedSignature === razorpaySignature
}

export const verifyRazorpayWebhookSignature = (bodyText, signature, webhookSecret) => {
  const secret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET
  if (!secret || !signature) return false
  const expectedSignature = crypto.createHmac('sha256', secret).update(bodyText).digest('hex')
  return expectedSignature === signature
}
