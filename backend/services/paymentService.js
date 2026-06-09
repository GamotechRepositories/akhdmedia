import crypto from 'crypto'
import Razorpay from 'razorpay'
import AppError from '../utils/AppError.js'

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new AppError('Online payment is not configured. Please contact support.', 503)
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret })
}

export const getRazorpayKeyId = () => {
  const keyId = process.env.RAZORPAY_KEY_ID
  if (!keyId) {
    throw new AppError('Online payment is not configured. Please contact support.', 503)
  }
  return keyId
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
  if (order.paymentMethod === 'COD') return true
  if (order.paymentStatus === 'paid') return true
  if (!order.paymentStatus && order.status === 'confirmed') return true
  return false
}
