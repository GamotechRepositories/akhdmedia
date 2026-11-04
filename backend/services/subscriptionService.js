import { createPayPalSubscription, cancelPayPalSubscription } from './paypalSubscriptionService.js'
const resolvePlanDurationDays = (plan, fallbackInterval = 'monthly') => {
  if (plan?.durationDays && Number(plan.durationDays) > 0) {
    return Number(plan.durationDays)
  }
  const interval = plan?.interval || fallbackInterval
  if (interval === 'yearly') return 365
  if (interval === 'weekly') return 7
  return 30
}

import mongoose from 'mongoose'
import SubscriptionPlan from '../models/SubscriptionPlan.js'
import UserSubscription from '../models/UserSubscription.js'
import User from '../models/User.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import { generateLicenseNumber } from '../utils/licenseIds.js'
import AppError from '../utils/AppError.js'
import {
  createRazorpayOrder,
  createRazorpayPlan,
  createRazorpaySubscription,
  cancelRazorpaySubscription,
  getRazorpayKeyId,
  isRazorpayConfigured,
  verifyRazorpaySignature,
  verifyRazorpaySubscriptionSignature,
} from './paymentService.js'
import { getProductDirectDownloads } from './downloadService.js'
import {
  formatLinkExpiry,
  sendSubscriptionConfirmationEmail,
  sendSubscriptionVideoDownloadEmail,
} from './emailService.js'

export const getPublicSubscriptionPlans = async () => {
  return SubscriptionPlan.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean()
}

export const getActiveUserSubscriptions = async (userId) => {
  if (!userId) return []

  const now = new Date()
  await UserSubscription.updateMany(
    { userId, status: 'active', endDate: { $lte: now } },
    { $set: { status: 'expired' } },
  )

  return UserSubscription.find({
    userId,
    status: 'active',
    endDate: { $gt: now },
  })
    .sort({ endDate: 1, createdAt: 1 })
    .populate('planId')
}

export const getActiveUserSubscription = async (userId) => {
  if (!userId) return null
  const subs = await getActiveUserSubscriptions(userId)
  if (!subs || subs.length === 0) return null

  const available = subs.find((s) => (s.videoQuotaRemaining ?? 0) > 0)
  return available || subs[0]
}

export const getUserSubscriptionOverview = async (userId) => {
  if (!userId) return null
  const now = new Date()

  // 1. Try active first
  let subscription = await getActiveUserSubscription(userId)
  if (subscription) return subscription

  // 2. Try on_hold or under_review
  subscription = await UserSubscription.findOne({
    userId,
    status: { $in: ['on_hold', 'under_review'] },
    endDate: { $gt: now },
  })
    .sort({ createdAt: -1 })
    .populate('planId')
  if (subscription) return subscription

  // 3. Fallback to latest cancelled or expired
  return UserSubscription.findOne({
    userId,
    status: { $in: ['cancelled', 'expired'] },
  })
    .sort({ createdAt: -1 })
    .populate('planId')
}

export const getOrCreateRazorpayPlan = async (plan, forceRecreate = false) => {
  if (plan.razorpayPlanId && !forceRecreate) {
    return plan.razorpayPlanId
  }

  let period = 'monthly'
  let rzpInterval = 1
  if (plan.interval === 'weekly') {
    period = 'weekly'
    rzpInterval = 1
  } else if (plan.interval === 'yearly') {
    period = 'yearly'
    rzpInterval = 1
  } else if (plan.interval === 'days' || plan.interval === 'custom') {
    period = 'daily'
    rzpInterval = Math.max(1, Number(plan.durationDays) || 1)
  } else {
    period = 'monthly'
    rzpInterval = 1
  }

  const subtotal = Number(plan.price) || 0
  const gstPercentage = Number(plan.gstPercentage ?? 0)
  const gstAmount = Math.round((subtotal * gstPercentage) / 100)
  const totalAmount = subtotal + gstAmount

  const rzpPlan = await createRazorpayPlan({
    period,
    interval: rzpInterval,
    name: plan.name,
    amount: totalAmount,
    currency: plan.currency || 'INR',
    description: plan.tagline || plan.name,
  })

  plan.razorpayPlanId = rzpPlan.id
  await plan.save()
  return rzpPlan.id
}

export const createSubscriptionCheckout = async ({ user, planId, paymentProvider = 'razorpay', whatsappNumber, policyAgreed }) => {
  if (!user) throw new AppError('Authentication required', 401)

  const plan = await SubscriptionPlan.findById(planId)
  if (!plan || !plan.isActive) {
    throw new AppError('Selected subscription plan is not available', 404)
  }

  const now = new Date()
  const durationDays = resolvePlanDurationDays(plan)
  const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

  const subtotal = Number(plan.price) || 0
  const gstPercentage = Number(plan.gstPercentage ?? 0)
  const gstAmount = Math.round((subtotal * gstPercentage) / 100)
  const totalAmount = subtotal + gstAmount

  // If plan is completely free (0 cost)
  if (subtotal === 0) {
    const activeSub = await UserSubscription.create({
      userId: user._id,
      planId: plan._id,
      planSnapshot: {
        name: plan.name,
        tagline: plan.tagline,
        interval: plan.interval,
        price: 0,
        subtotal: 0,
        gstPercentage: 0,
        gstAmount: 0,
        totalPayable: 0,
        videoQuota: plan.videoQuota,
      },
      price: 0,
      subtotal: 0,
      gstPercentage: 0,
      gstAmount: 0,
      totalAmount: 0,
      amountPaid: 0,
      currency: plan.currency || 'INR',
      videoQuota: plan.videoQuota,
      videoQuotaRemaining: plan.videoQuota,
      startDate: now,
      endDate,
      status: 'active',
      paymentProvider: 'free',
      paymentStatus: 'paid',
      whatsappNumber: whatsappNumber?.trim() || user.phone || '',
      policyAgreed: Boolean(policyAgreed),
      policyAgreedAt: policyAgreed ? new Date() : null,
    })

    await User.findByIdAndUpdate(user._id, { isPremium: true })

    try {
      sendSubscriptionConfirmationEmail({
        user,
        subscription: activeSub,
        plan,
      }).catch((e) => console.error('[email] Free subscription email error:', e.message))
    } catch (err) {
      console.error('[email] Failed dispatching free subscription email:', err.message)
    }

    return {
      success: true,
      directActive: true,
      subscription: activeSub,
    }
  }

  if (paymentProvider === 'paypal') {
    const pendingSub = await UserSubscription.create({
      userId: user._id, planId: plan._id,
      planSnapshot: {
        name: plan.name, tagline: plan.tagline, interval: plan.interval,
        price: plan.price, subtotal, gstPercentage, gstAmount,
        totalPayable: totalAmount, videoQuota: plan.videoQuota,
      },
      price: plan.price, subtotal, gstPercentage, gstAmount, totalAmount,
      currency: plan.currency || 'INR', videoQuota: plan.videoQuota,
      videoQuotaRemaining: plan.videoQuota, startDate: now, endDate,
      status: 'pending', paymentProvider: 'paypal', paymentStatus: 'pending',
      whatsappNumber: whatsappNumber?.trim() || user.phone || '',
      policyAgreed: Boolean(policyAgreed), policyAgreedAt: policyAgreed ? now : null,
    })
    const paypal = await createPayPalSubscription({ subscription: pendingSub, plan })
    return { success: true, directActive: false, subscriptionId: pendingSub._id, paypal }
  }

  if (paymentProvider === 'razorpay') {
    if (!isRazorpayConfigured()) {
      throw new AppError('Razorpay is not configured right now. Please contact support.', 503)
    }

    // AutoPay Recurring Subscription via Razorpay Subscriptions API
    let rzpPlanId = await getOrCreateRazorpayPlan(plan)
    let totalCount = 60
    if (plan.interval === 'yearly') totalCount = 10
    else if (plan.interval === 'weekly') totalCount = 120
    else if (plan.interval === 'days' || plan.interval === 'custom') {
      const days = Math.max(1, Number(plan.durationDays) || 30)
      totalCount = Math.max(12, Math.floor(1825 / days))
    }
    const subscriptionNotes = {
      userId: user._id.toString(),
      planId: plan._id.toString(),
      planName: plan.name,
      whatsappNumber: whatsappNumber?.trim() || user.phone || '',
      subtotal: String(subtotal),
      gstPercentage: String(gstPercentage),
      gstAmount: String(gstAmount),
      totalPayable: String(totalAmount),
    }

    let rzpSub
    try {
      rzpSub = await createRazorpaySubscription({
        planId: rzpPlanId,
        totalCount,
        customerNotify: 1,
        notes: subscriptionNotes,
      })
    } catch (subErr) {
      // Smart Auto-Recovery:
      // If Razorpay returns BAD_REQUEST_ERROR because cached planId does not exist on this active Razorpay account
      // (e.g. keys switched between test and live, or different merchant account)
      const errDesc = String(subErr?.error?.description || subErr?.message || '')
      const isInvalidPlan =
        subErr?.statusCode === 400 &&
        (errDesc.toLowerCase().includes('id provided is invalid') ||
          errDesc.toLowerCase().includes('could not be found') ||
          errDesc.toLowerCase().includes('plan') ||
          subErr?.error?.code === 'BAD_REQUEST_ERROR')

      if (isInvalidPlan) {
        console.warn(
          `[subscription] Cached razorpayPlanId "${rzpPlanId}" is invalid on current Razorpay account (${errDesc}). Auto-regenerating plan...`
        )
        plan.razorpayPlanId = ''
        rzpPlanId = await getOrCreateRazorpayPlan(plan, true)
        try {
          rzpSub = await createRazorpaySubscription({
            planId: rzpPlanId,
            totalCount,
            customerNotify: 1,
            notes: subscriptionNotes,
          })
        } catch (retryErr) {
          const retryDesc = retryErr?.error?.description || retryErr?.message || 'Payment gateway rejected subscription setup'
          throw new AppError(retryDesc, retryErr?.statusCode || 400)
        }
      } else {
        const directDesc = subErr?.error?.description || subErr?.message || 'Payment gateway rejected subscription setup'
        throw new AppError(directDesc, subErr?.statusCode || 400)
      }
    }

    const pendingSub = await UserSubscription.create({
      userId: user._id,
      planId: plan._id,
      planSnapshot: {
        name: plan.name,
        tagline: plan.tagline,
        interval: plan.interval,
        price: plan.price,
        subtotal,
        gstPercentage,
        gstAmount,
        totalPayable: totalAmount,
        videoQuota: plan.videoQuota,
      },
      price: plan.price,
      subtotal,
      gstPercentage,
      gstAmount,
      totalAmount,
      currency: plan.currency || 'INR',
      videoQuota: plan.videoQuota,
      videoQuotaRemaining: plan.videoQuota,
      startDate: now,
      endDate,
      status: 'pending',
      paymentProvider: 'razorpay',
      paymentStatus: 'pending',
      razorpaySubscriptionId: rzpSub.id,
      whatsappNumber: whatsappNumber?.trim() || user.phone || '',
      policyAgreed: Boolean(policyAgreed),
      policyAgreedAt: policyAgreed ? new Date() : null,
    })

    return {
      success: true,
      directActive: false,
      subscriptionId: pendingSub._id,
      razorpay: {
        subscriptionId: rzpSub.id,
        keyId: getRazorpayKeyId(),
        amount: totalAmount,
      },
      plan: {
        name: plan.name,
        price: plan.price,
        subtotal,
        gstPercentage,
        gstAmount,
        totalPayable: totalAmount,
        interval: plan.interval,
        videoQuota: plan.videoQuota,
      },
    }
  }

  throw new AppError(`Payment provider ${paymentProvider} is not supported for subscriptions yet`, 400)
}

export const verifySubscriptionPayment = async ({
  userId,
  subscriptionId,
  razorpayOrderId,
  razorpaySubscriptionId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  if (!subscriptionId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError('Missing payment verification parameters', 400)
  }

  // Security: Cryptographic HMAC signature check
  let isValid = false
  if (razorpaySubscriptionId) {
    isValid = verifyRazorpaySubscriptionSignature({
      razorpayPaymentId,
      razorpaySubscriptionId,
      razorpaySignature,
    })
  } else if (razorpayOrderId) {
    isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    })
  }

  if (!isValid) {
    throw new AppError('Cryptographic payment verification failed', 400)
  }

  const subscription = await UserSubscription.findOne({
    _id: subscriptionId,
    userId,
  })

  if (!subscription) {
    throw new AppError('Subscription not found', 404)
  }

  if (subscription.paymentProvider !== 'razorpay' ||
      (subscription.razorpaySubscriptionId
        ? razorpaySubscriptionId !== subscription.razorpaySubscriptionId
        : razorpayOrderId !== subscription.razorpayOrderId)) {
    throw new AppError('Payment does not match this subscription', 400)
  }

  if (subscription.status === 'active' && subscription.paymentStatus === 'paid') {
    return subscription
  }

  const plan = await SubscriptionPlan.findById(subscription.planId)
  const durationDays = resolvePlanDurationDays(plan, subscription.planSnapshot?.interval)
  const now = new Date()
  const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

  subscription.status = 'active'
  subscription.paymentStatus = 'paid'
  subscription.amountPaid = subscription.totalAmount || subscription.price
  subscription.startDate = now
  subscription.endDate = endDate
  subscription.razorpayPaymentId = razorpayPaymentId
  if (razorpaySubscriptionId) subscription.razorpaySubscriptionId = razorpaySubscriptionId
  if (razorpayOrderId) subscription.razorpayOrderId = razorpayOrderId
  subscription.razorpaySignature = razorpaySignature
  await subscription.save()

  await User.findByIdAndUpdate(userId, { isPremium: true })

  try {
    const userDoc = await User.findById(userId)
    sendSubscriptionConfirmationEmail({
      user: userDoc,
      subscription,
      plan,
    }).catch((e) => console.error('[email] Subscription email error:', e.message))
  } catch (err) {
    console.error('[email] Failed dispatching subscription email:', err.message)
  }

  return subscription
}

export const cancelUserSubscription = async (userId, targetPlanId = null) => {
  if (!userId) throw new AppError('Authentication required', 401)

  const query = {
    userId,
    status: 'active',
    endDate: { $gt: new Date() },
  }
  if (targetPlanId) {
    query.$or = [{ planId: targetPlanId }, { _id: targetPlanId }]
  }

  const subscription = await UserSubscription.findOne(query).sort({ createdAt: -1 })

  if (!subscription) {
    throw new AppError('No active subscription found to cancel', 404)
  }

  if (subscription.cancelAtPeriodEnd) {
    return {
      success: true,
      alreadyCancelled: true,
      message: `Your subscription is already scheduled to end on ${new Date(subscription.endDate).toLocaleDateString('en-IN')}`,
      endDate: subscription.endDate,
    }
  }

  if (subscription.paymentProvider === 'paypal' && subscription.paypalSubscriptionId) {
    await cancelPayPalSubscription(subscription.paypalSubscriptionId)
  }

  if (subscription.razorpaySubscriptionId) {
    try {
      await cancelRazorpaySubscription(subscription.razorpaySubscriptionId, true)
    } catch (err) {
      console.warn('Failed to cancel Razorpay mandate on provider:', err.message)
    }
  }

  subscription.cancelAtPeriodEnd = true
  subscription.cancelledAt = new Date()
  await subscription.save()

  return {
    success: true,
    message: `AutoPay has been successfully cancelled. You will not be charged for the next cycle, and you keep video access until ${new Date(subscription.endDate).toLocaleDateString('en-IN')}.`,
    endDate: subscription.endDate,
  }
}

export const handleRazorpayWebhook = async ({ event, payload }) => {
  if (event === 'subscription.charged') {
    const subEntity = payload?.subscription?.entity
    const rzpSubId = subEntity?.id

    if (rzpSubId) {
      const subscription = await UserSubscription.findOne({
        razorpaySubscriptionId: rzpSubId,
      })

      if (subscription) {
        const interval = subscription.planSnapshot?.interval || 'monthly'
        const durationDays = resolvePlanDurationDays(subscription.planSnapshot, interval)
        const now = new Date()
        const currentEndDate = new Date(subscription.endDate)
        const baseDate = currentEndDate > now ? currentEndDate : now
        const newEndDate = new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000)

        subscription.status = 'active'
        subscription.paymentStatus = 'paid'
        subscription.amountPaid = subscription.price
        subscription.endDate = newEndDate
        subscription.videoQuotaRemaining = subscription.planSnapshot?.videoQuota || subscription.videoQuota || 20
        subscription.currentCycle = (subscription.currentCycle || 1) + 1
        await subscription.save()

        await User.findByIdAndUpdate(subscription.userId, { isPremium: true })
        console.log(`[AutoPay Webhook] Successfully renewed subscription for user ${subscription.userId}. Next cycle ends: ${newEndDate}`)
      }
    }
  } else if (event === 'subscription.cancelled' || event === 'subscription.completed') {
    const subEntity = payload?.subscription?.entity
    const rzpSubId = subEntity?.id
    if (rzpSubId) {
      await UserSubscription.updateMany(
        { razorpaySubscriptionId: rzpSubId },
        { $set: { status: 'cancelled', cancelAtPeriodEnd: true } }
      )
    }
  }

  return { received: true }
}

export const checkVideoClaimStatus = async ({ userId, productId }) => {
  if (!userId) {
    return { hasSubscription: false }
  }

  const activeSubs = await getActiveUserSubscriptions(userId)
  if (!activeSubs || activeSubs.length === 0) {
    const specialSub = await UserSubscription.findOne({
      userId,
      status: { $in: ['on_hold', 'under_review'] },
      endDate: { $gt: new Date() },
    }).sort({ createdAt: -1 })

    if (specialSub) {
      return {
        hasSubscription: true,
        isBlocked: true,
        status: specialSub.status,
        adminReason: specialSub.adminReason || '',
        planName: specialSub.planSnapshot?.name || 'Subscription Plan',
      }
    }
    return { hasSubscription: false }
  }

  const RESEND_WINDOW_MS = 2 * 60 * 1000 // 2 minutes

  let isClaimed = false
  let lastClaimedAt = null
  for (const s of activeSubs) {
    if (s.downloadedVideos && s.downloadedVideos.length > 0) {
      for (const item of s.downloadedVideos) {
        if (item.productId && item.productId.toString() === productId.toString()) {
          isClaimed = true
          if (!lastClaimedAt || new Date(item.claimedAt) > new Date(lastClaimedAt)) {
            lastClaimedAt = item.claimedAt
          }
        }
      }
    }
  }

  const timeSinceLastClaim = lastClaimedAt ? Date.now() - new Date(lastClaimedAt).getTime() : Infinity
  const resendWindowRemainingMs = isClaimed ? Math.max(0, RESEND_WINDOW_MS - timeSinceLastClaim) : 0
  const canEmergencyResend = resendWindowRemainingMs > 0

  const totalQuota = activeSubs.reduce((acc, s) => acc + (s.videoQuota || 0), 0)
  const totalRemaining = activeSubs.reduce((acc, s) => acc + (s.videoQuotaRemaining || 0), 0)
  const furthestEndDate = activeSubs.reduce(
    (max, s) => (new Date(s.endDate) > new Date(max) ? s.endDate : max),
    activeSubs[0].endDate,
  )

  const planNames = activeSubs.map((s) => s.planSnapshot?.name || s.planId?.name || 'Active Plan')
  const planName = activeSubs.length > 1 ? planNames.join(' + ') : planNames[0]

  return {
    hasSubscription: true,
    isClaimed,
    lastClaimedAt,
    canEmergencyResend,
    resendWindowRemainingMs,
    planName,
    videoQuota: totalQuota,
    videoQuotaRemaining: totalRemaining,
    quotaRemaining: totalRemaining,
    usedQuota: totalQuota - totalRemaining,
    endDate: furthestEndDate,
    activePlansCount: activeSubs.length,
  }
}

export const claimVideoWithSubscription = async ({
  userId,
  productId,
  imageSize = '',
  action = 'claim',
}) => {
  if (!userId) throw new AppError('Authentication required', 401)

  const user = await User.findById(userId)
  if (!user) {
    throw new AppError('User account not found', 404)
  }
  if (!user.email) {
    throw new AppError('Please add a valid email address to your account to receive video download links.', 400)
  }

  const activeSubs = await getActiveUserSubscriptions(userId)

  if (!activeSubs || activeSubs.length === 0) {
    const specialSub = await UserSubscription.findOne({
      userId,
      status: { $in: ['on_hold', 'under_review', 'cancelled'] },
    }).sort({ createdAt: -1 })

    if (specialSub?.status === 'on_hold') {
      const reasonMsg = specialSub.adminReason ? ` Reason: ${specialSub.adminReason}` : ''
      throw new AppError(`Your subscription is currently ON HOLD by Admin.${reasonMsg}`, 403)
    }
    if (specialSub?.status === 'under_review') {
      const reasonMsg = specialSub.adminReason ? ` Reason: ${specialSub.adminReason}` : ''
      throw new AppError(`Your account is currently UNDER REVIEW by Admin.${reasonMsg}`, 403)
    }
    if (specialSub?.status === 'cancelled') {
      throw new AppError('Your subscription was cancelled by Admin.', 403)
    }

    throw new AppError('No active subscription found. Please subscribe to download.', 403)
  }

  const product = await Product.findById(productId)
  if (!product) {
    throw new AppError('Video product not found', 404)
  }

  const totalQuota = activeSubs.reduce((acc, s) => acc + (s.videoQuota || 0), 0)
  const RESEND_WINDOW_MS = 2 * 60 * 1000 // 2 minutes

  // Check if previously claimed
  let lastClaim = null
  let lastClaimSub = null
  for (const s of activeSubs) {
    if (s.downloadedVideos && s.downloadedVideos.length > 0) {
      for (const item of s.downloadedVideos) {
        if (item.productId && item.productId.toString() === productId.toString()) {
          if (!lastClaim || new Date(item.claimedAt) > new Date(lastClaim.claimedAt)) {
            lastClaim = item
            lastClaimSub = s
          }
        }
      }
    }
  }

  // A) Emergency Resend (Available within 2 minutes of recent claim, 0 credit)
  if (action === 'resend') {
    if (!lastClaim) {
      throw new AppError('This video has not been claimed yet. Please claim it with 1 credit.', 400)
    }
    const elapsedMs = Date.now() - new Date(lastClaim.claimedAt).getTime()
    if (elapsedMs > RESEND_WINDOW_MS) {
      throw new AppError('The 2-minute resend window has ended. You can use 1 credit to download again.', 400)
    }

    const { files, message } = await getProductDirectDownloads(product, imageSize)
    const totalRemaining = activeSubs.reduce((acc, sub) => acc + (sub.videoQuotaRemaining || 0), 0)
    const linkExpiry = formatLinkExpiry(new Date())

    let emailSent = false
    try {
      const emailRes = await sendSubscriptionVideoDownloadEmail({
        user,
        product,
        files,
        imageSize,
        linkExpiry,
        quotaRemaining: totalRemaining,
        totalQuota,
        planName: lastClaimSub?.planSnapshot?.name || 'Active Plan',
        isRedownload: true,
      })
      emailSent = emailRes?.sent ?? true
    } catch (err) {
      console.error('[email] Failed resending subscription video download email:', err.message)
    }

    return {
      success: true,
      isResend: true,
      isClaimed: true,
      emailSent,
      customerEmail: user.email,
      linkExpiry,
      lastClaimedAt: lastClaim.claimedAt,
      resendWindowRemainingMs: Math.max(0, RESEND_WINDOW_MS - elapsedMs),
      message: `Master video download link re-sent to your registered email (${user.email})! The link is valid for 3 days.`,
      videoQuotaRemaining: totalRemaining,
      videoQuota: totalQuota,
      deliveryMessage: message,
    }
  }

  // B) Regular Claim or Re-Claim (Deducts 1 credit from quota, sends fresh 3-day link, opens 2-minute emergency resend)
  const availableSub = activeSubs.find((s) => (s.videoQuotaRemaining || 0) > 0)

  if (!availableSub) {
    throw new AppError(
      `Your subscription video quota is exhausted across all active plans (${totalQuota}/${totalQuota} videos used). Please renew your subscription or purchase individually.`,
      400,
    )
  }

  const claimTime = new Date()
  availableSub.videoQuotaRemaining -= 1

  const licenseNumber = generateLicenseNumber()
  const orderNumber = `FV${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`

  const orderDoc = await Order.create({
    sessionId: `sub_${user._id.toString()}_${Date.now()}`,
    userId: user._id,
    orderNumber,
    items: [
      {
        productId: product._id.toString(),
        clipId: product.clipId || '',
        licenseNumber,
        name: product.name,
        brand: product.brand || '',
        imageSize: imageSize || '4K-UHD RAW Master',
        image: product.featuredImage?.url || product.previewImage?.url || product.thumbnail || '',
        quantity: 1,
        basePrice: 0,
        gstPercentage: 0,
        gstAmount: 0,
        price: 0,
        lineTotal: 0,
      },
    ],
    billingAddress: {
      name: user.name || 'Subscriber',
      email: user.email || '',
      phone: user.phone || availableSub.whatsappNumber || '',
      purchaseReasons: ['Subscription Quota Download'],
      purchaseReasonOther: '',
    },
    paymentMethod: 'subscription',
    paymentProvider: 'subscription',
    subtotalAmount: 0,
    gstAmount: 0,
    totalAmount: 0,
    paymentStatus: 'paid',
    status: 'completed',
    subscriptionId: availableSub._id,
    subscriptionPlanName: availableSub.planSnapshot?.name || 'Subscription Plan',
    createdAt: claimTime,
  })

  availableSub.downloadedVideos.push({
    productId: product._id,
    clipId: product.clipId || '',
    name: product.name,
    imageSize,
    licenseNumber,
    orderId: orderDoc._id,
    orderNumber: orderDoc.orderNumber,
    claimedAt: claimTime,
  })
  await availableSub.save()

  // Calculate new overall remaining across all active plans
  const totalRemaining = activeSubs.reduce((acc, s) => acc + (s.videoQuotaRemaining || 0), 0)
  const { files, message } = await getProductDirectDownloads(product, imageSize)
  const linkExpiry = formatLinkExpiry(claimTime)

  let emailSent = false
  try {
    const emailRes = await sendSubscriptionVideoDownloadEmail({
      user,
      product,
      files,
      imageSize,
      licenseNumber,
      orderNumber: orderDoc.orderNumber,
      linkExpiry,
      quotaRemaining: totalRemaining,
      totalQuota,
      planName: availableSub.planSnapshot?.name || 'Active Plan',
      isRedownload: Boolean(lastClaim),
    })
    emailSent = emailRes?.sent ?? true
  } catch (err) {
    console.error('[email] Failed sending subscription video claim email:', err.message)
  }

  const isReclaim = Boolean(lastClaim)

  return {
    success: true,
    isClaimed: true,
    isReclaim,
    emailSent,
    customerEmail: user.email,
    linkExpiry,
    lastClaimedAt: claimTime,
    resendWindowRemainingMs: RESEND_WINDOW_MS,
    message: isReclaim
      ? `Video re-downloaded with 1 credit! Master link sent to your registered email (${user.email}) valid for 3 days.`
      : `Master video download link sent to your registered email (${user.email})! The link is valid for 3 days.`,
    videoQuotaRemaining: totalRemaining,
    videoQuota: totalQuota,
    deliveryMessage: message,
  }
}

// Admin Services
export const adminGetPlans = async () => {
  const plans = await SubscriptionPlan.find().sort({ sortOrder: 1, createdAt: -1 }).lean()
  const planIds = plans.map((p) => p._id)

  const counts = await UserSubscription.aggregate([
    { $match: { planId: { $in: planIds }, status: { $ne: 'pending' } } },
    {
      $group: {
        _id: '$planId',
        activeCount: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        totalCount: { $sum: 1 },
      },
    },
  ])
  const countMap = counts.reduce((acc, c) => ({ ...acc, [c._id.toString()]: c }), {})

  return plans.map((p) => {
    const stats = countMap[p._id.toString()] || { activeCount: 0, totalCount: 0 }
    return {
      ...p,
      activeSubscribersCount: stats.activeCount || 0,
      totalSubscribersCount: stats.totalCount || 0,
    }
  })
}

export const adminGetPlanById = async (id) => {
  const plan = await SubscriptionPlan.findById(id).lean()
  if (!plan) throw new AppError('Subscription plan not found', 404)
  return plan
}

export const adminCreatePlan = async (data) => {
  const plan = await SubscriptionPlan.create(data)
  return plan
}

export const adminUpdatePlan = async (id, data) => {
  const existing = await SubscriptionPlan.findById(id)
  if (existing) {
    const priceChanged = data.price !== undefined && Number(data.price) !== Number(existing.price)
    const gstChanged = data.gstPercentage !== undefined && Number(data.gstPercentage) !== Number(existing.gstPercentage)
    const intervalChanged = data.interval && data.interval !== existing.interval
    if (priceChanged || gstChanged || intervalChanged) {
      data.razorpayPlanId = ''
    }
  }

  const plan = await SubscriptionPlan.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  })
  if (!plan) throw new AppError('Subscription plan not found', 404)
  return plan
}

export const adminDeletePlan = async (id) => {
  const plan = await SubscriptionPlan.findByIdAndDelete(id)
  if (!plan) throw new AppError('Subscription plan not found', 404)
  return plan
}

export const adminGetSubscribers = async ({ page = 1, limit = 20, search = '', status = 'all', planId = 'all' } = {}) => {
  const query = {}

  if (status && status !== 'all' && status !== 'pending') {
    query.status = status
  } else {
    // Exclude pending / incomplete checkout attempts from the subscriber list
    query.status = { $ne: 'pending' }
  }

  if (planId && planId !== 'all') {
    query.planId = planId
  }

  const skip = (page - 1) * limit

  let userIds = null
  if (search?.trim()) {
    const matchedUsers = await User.find({
      $or: [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { phone: { $regex: search.trim(), $options: 'i' } },
      ],
    }).select('_id')
    userIds = matchedUsers.map((u) => u._id)
    query.userId = { $in: userIds }
  }

  const [subscribers, total] = await Promise.all([
    UserSubscription.find(query)
      .populate('userId', 'name email phone')
      .populate('planId', 'name interval price videoQuota')
      .populate({
        path: 'downloadedVideos.productId',
        select: 'name price clipId featuredImage previewImage thumbnail duration resolution',
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    UserSubscription.countDocuments(query),
  ])

  const enrichedSubscribers = subscribers.map((sub) => ({
    ...sub,
    downloadedVideos: (sub.downloadedVideos || []).map((v) => {
      const prod = v.productId || {}
      return {
        ...v,
        originalPrice: typeof prod.price === 'number' ? prod.price : 0,
        thumbnail: prod.featuredImage?.url || prod.previewImage?.url || prod.thumbnail || '',
        clipId: v.clipId || prod.clipId || '',
      }
    }),
  }))

  return {
    subscribers: enrichedSubscribers,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  }
}

export const adminGetSubscriberById = async (id) => {
  const sub = await UserSubscription.findById(id)
    .populate('userId', 'name email phone avatar isPremium')
    .populate('planId', 'name interval price videoQuota features')
    .populate({
      path: 'downloadedVideos.productId',
      select: 'name price clipId featuredImage previewImage thumbnail duration resolution slug',
    })
    .lean()

  if (!sub) throw new AppError('Subscriber not found', 404)

  const videosWithPrice = (sub.downloadedVideos || []).map((v) => {
    const prod = v.productId || {}
    return {
      _id: v._id,
      productId: prod._id || v.productId,
      name: v.name || prod.name || 'Video Clip',
      clipId: v.clipId || prod.clipId || '',
      imageSize: v.imageSize || '4K-UHD RAW Master',
      licenseNumber: v.licenseNumber || '',
      orderId: v.orderId,
      orderNumber: v.orderNumber,
      claimedAt: v.claimedAt,
      originalPrice: typeof prod.price === 'number' ? prod.price : 0,
      thumbnail: prod.featuredImage?.url || prod.previewImage?.url || prod.thumbnail || '',
      resolution: prod.resolution || '',
      duration: prod.duration || '',
    }
  })

  return {
    ...sub,
    downloadedVideos: videosWithPrice,
  }
}

export const adminUpdateSubscriber = async (id, payload) => {
  const current = await UserSubscription.findById(id)
  if (!current) throw new AppError('Subscriber record not found', 404)

  const allowed = {}
  if (payload.videoQuotaRemaining !== undefined) {
    allowed.videoQuotaRemaining = Number(payload.videoQuotaRemaining)
  }
  if (payload.videoQuota !== undefined) {
    allowed.videoQuota = Number(payload.videoQuota)
  }
  if (payload.adminReason !== undefined) {
    allowed.adminReason = payload.adminReason
  }
  if (payload.amountPaid !== undefined) {
    allowed.amountPaid = Math.max(0, Number(payload.amountPaid))
  }
  if (payload.price !== undefined) {
    allowed.price = Math.max(0, Number(payload.price))
  }
  if (payload.paymentStatus !== undefined) {
    allowed.paymentStatus = payload.paymentStatus
  }
  if (payload.paymentProvider !== undefined) {
    allowed.paymentProvider = payload.paymentProvider
  }
  if (payload.whatsappNumber !== undefined) {
    allowed.whatsappNumber = String(payload.whatsappNumber || '').trim()
  }

  // Handle status transitions
  if (payload.status) {
    allowed.status = payload.status

    // 1. Entering ON_HOLD
    if (payload.status === 'on_hold') {
      if (current.status !== 'on_hold') {
        allowed.holdStartedAt = new Date()
      }
    }

    // 2. Resuming from ON_HOLD to ACTIVE: calculate held duration and automatically add to endDate!
    if (current.status === 'on_hold' && payload.status === 'active') {
      if (current.holdStartedAt) {
        const heldDurationMs = Math.max(0, Date.now() - new Date(current.holdStartedAt).getTime())
        const baseEndDate = payload.endDate ? new Date(payload.endDate) : new Date(current.endDate)
        allowed.endDate = new Date(baseEndDate.getTime() + heldDurationMs)
        allowed.totalHoldDurationMs = (current.totalHoldDurationMs || 0) + heldDurationMs
        allowed.holdStartedAt = null
      }
    }

    // 3. CANCELLED
    if (payload.status === 'cancelled') {
      allowed.cancelledAt = new Date()
    }
  }

  // Allow manual override of endDate if not already auto-extended
  if (payload.endDate && !allowed.endDate) {
    allowed.endDate = new Date(payload.endDate)
  }

  const updated = await UserSubscription.findByIdAndUpdate(id, allowed, { new: true })
    .populate('userId', 'name email phone')
    .populate('planId', 'name interval price')

  if (!updated) throw new AppError('Subscriber record not found', 404)

  const targetUserId = current.userId

  if (updated.status === 'active') {
    await User.findByIdAndUpdate(targetUserId, { isPremium: true })
  } else if (['expired', 'cancelled', 'on_hold', 'under_review'].includes(updated.status)) {
    // If no other active subscription, set isPremium = false
    const otherActive = await UserSubscription.findOne({
      userId: targetUserId,
      _id: { $ne: updated._id },
      status: 'active',
      endDate: { $gt: new Date() },
    })
    if (!otherActive) {
      await User.findByIdAndUpdate(targetUserId, { isPremium: false })
    }
  }

  return updated
}

export const adminAssignSubscription = async ({
  userId,
  userEmail,
  planId,
  amountPaid = 0,
  videoQuota,
  durationDays,
  paymentStatus = 'paid',
  paymentProvider = 'free',
  adminReason = '',
  whatsappNumber = '',
}) => {
  let user = null
  const candidateId = userId || null
  if (candidateId && mongoose.Types.ObjectId.isValid(candidateId)) {
    user = await User.findById(candidateId)
  }
  if (!user && userEmail) {
    user = await User.findOne({ email: userEmail.trim().toLowerCase() })
  }
  if (!user) throw new AppError('Customer user not found', 404)

  const plan = await SubscriptionPlan.findById(planId)
  if (!plan) throw new AppError('Subscription plan not found', 404)

  const now = new Date()
  const days = Number(durationDays) || resolvePlanDurationDays(plan)
  const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  const quota = videoQuota !== undefined && videoQuota !== null && videoQuota !== ''
    ? Number(videoQuota)
    : plan.videoQuota

  const subtotal = Number(plan.price) || 0
  const gstPercentage = Number(plan.gstPercentage ?? 0)
  const gstAmount = Math.round((subtotal * gstPercentage) / 100)
  const totalAmount = subtotal + gstAmount

  const subscription = await UserSubscription.create({
    userId: user._id,
    planId: plan._id,
    planSnapshot: {
      name: plan.name,
      tagline: plan.tagline,
      interval: plan.interval,
      price: plan.price,
      subtotal,
      gstPercentage,
      gstAmount,
      totalPayable: totalAmount,
      videoQuota: plan.videoQuota,
    },
    price: plan.price,
    subtotal,
    gstPercentage,
    gstAmount,
    totalAmount,
    amountPaid: Number(amountPaid) || 0,
    currency: plan.currency || 'INR',
    videoQuota: quota,
    videoQuotaRemaining: quota,
    startDate: now,
    endDate,
    status: 'active',
    paymentProvider: paymentProvider || (Number(amountPaid) === 0 ? 'free' : 'admin_manual'),
    paymentStatus: paymentStatus || 'paid',
    adminReason: adminReason || (Number(amountPaid) === 0 ? 'Admin granted complimentary access' : 'Admin assigned subscription'),
    whatsappNumber: (whatsappNumber || user.phone || '').trim(),
  })

  await User.findByIdAndUpdate(user._id, { isPremium: true })

  try {
    sendSubscriptionConfirmationEmail({
      user,
      subscription,
      plan,
    }).catch((e) => console.error('[email] Admin assign subscription email error:', e.message))
  } catch (err) {
    console.error('[email] Failed dispatching admin assign email:', err.message)
  }

  return subscription
}

export const syncPastSubscriptionClaimsToOrders = async () => {
  try {
    const subs = await UserSubscription.find({ 'downloadedVideos.0': { $exists: true } }).populate('userId')
    for (const sub of subs) {
      if (!sub.userId) continue
      let modified = false
      for (const item of sub.downloadedVideos) {
        if (!item.orderId) {
          const existingOrder = await Order.findOne({
            userId: sub.userId._id,
            'items.productId': item.productId?.toString(),
            paymentProvider: 'subscription',
          })
          if (existingOrder) {
            item.orderId = existingOrder._id
            item.orderNumber = existingOrder.orderNumber
            item.licenseNumber = existingOrder.items?.[0]?.licenseNumber || item.licenseNumber || ''
            modified = true
          } else {
            const product = await Product.findById(item.productId).lean()
            const licenseNumber = item.licenseNumber || generateLicenseNumber()
            const orderNumber = `FV${Date.now()}${Math.floor(Math.random() * 9000 + 1000)}`
            const orderDoc = await Order.create({
              sessionId: `sub_${sub.userId._id.toString()}_${Date.now()}`,
              userId: sub.userId._id,
              orderNumber,
              items: [
                {
                  productId: item.productId.toString(),
                  clipId: item.clipId || product?.clipId || '',
                  licenseNumber,
                  name: item.name || product?.name || 'Editorial Footage',
                  brand: product?.brand || '',
                  imageSize: item.imageSize || '4K-UHD RAW Master',
                  image: product?.featuredImage?.url || product?.previewImage?.url || product?.thumbnail || '',
                  quantity: 1,
                  basePrice: 0,
                  gstPercentage: 0,
                  gstAmount: 0,
                  price: 0,
                  lineTotal: 0,
                },
              ],
              billingAddress: {
                name: sub.userId.name || 'Subscriber',
                email: sub.userId.email || '',
                phone: sub.userId.phone || sub.whatsappNumber || '',
                purchaseReasons: ['Subscription Quota Download'],
                purchaseReasonOther: '',
              },
              paymentMethod: 'subscription',
              paymentProvider: 'subscription',
              subtotalAmount: 0,
              gstAmount: 0,
              totalAmount: 0,
              paymentStatus: 'paid',
              status: 'completed',
              subscriptionId: sub._id,
              subscriptionPlanName: sub.planSnapshot?.name || 'Subscription Plan',
              createdAt: item.claimedAt || new Date(),
            })
            item.orderId = orderDoc._id
            item.orderNumber = orderDoc.orderNumber
            item.licenseNumber = licenseNumber
            modified = true
            console.log(`[sync] Created missing order #${orderDoc.orderNumber} for subscription claim: ${item.name}`)
          }
        }
      }
      if (modified) {
        await sub.save()
      }
    }
  } catch (err) {
    console.error('[sync] Error syncing past subscription claims to orders:', err.message)
  }
}
