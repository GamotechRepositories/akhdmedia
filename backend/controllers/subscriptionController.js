import UserSubscription from '../models/UserSubscription.js'
import SubscriptionPlan from '../models/SubscriptionPlan.js'
import {
  buildSubscriptionCertificateBuffer,
  getSubscriptionCertificateFilename,
} from '../services/subscriptionCertificateService.js'
import asyncHandler from '../utils/asyncHandler.js'
import {
  checkVideoClaimStatus,
  claimVideoWithSubscription,
  createSubscriptionCheckout,
  getActiveUserSubscription,
  getActiveUserSubscriptions,
  getPublicSubscriptionPlans,
  verifySubscriptionPayment,
  cancelUserSubscription,
  handleRazorpayWebhook,
} from '../services/subscriptionService.js'
import { getUserById } from '../services/userAuthService.js'
import { verifyRazorpayWebhookSignature } from '../services/paymentService.js'

export const getPlans = asyncHandler(async (req, res) => {
  const plans = await getPublicSubscriptionPlans()
  res.json({
    success: true,
    data: { plans },
  })
})

export const getMySubscription = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id)
  const activeSubs = await getActiveUserSubscriptions(user._id)

  if (activeSubs && activeSubs.length > 0) {
    const totalQuota = activeSubs.reduce((acc, s) => acc + (s.videoQuota || 0), 0)
    const totalRemaining = activeSubs.reduce((acc, s) => acc + (s.videoQuotaRemaining || 0), 0)
    const furthestEndDate = activeSubs.reduce(
      (max, s) => (new Date(s.endDate) > new Date(max) ? s.endDate : max),
      activeSubs[0].endDate,
    )
    const planNames = activeSubs.map((s) => s.planSnapshot?.name || s.planId?.name || 'Active Plan')
    const primaryPlan = activeSubs[0]

    return res.json({
      success: true,
      data: {
        hasActiveSubscription: true,
        subscription: {
          id: primaryPlan._id,
          planName: activeSubs.length > 1 ? planNames.join(' + ') : planNames[0],
          tagline:
            activeSubs.length > 1
              ? `${activeSubs.length} Active Plans Combined`
              : primaryPlan.planSnapshot?.tagline || '',
          interval: activeSubs.some((s) => s.planSnapshot?.interval === 'yearly')
            ? 'yearly'
            : activeSubs.some((s) => s.planSnapshot?.interval === 'monthly')
            ? 'monthly'
            : activeSubs.some((s) => s.planSnapshot?.interval === 'weekly')
            ? 'weekly'
            : activeSubs[0].planSnapshot?.interval || 'monthly',
          price: activeSubs.reduce((acc, s) => acc + (s.price || 0), 0),
          videoQuota: totalQuota,
          videoQuotaRemaining: totalRemaining,
          usedQuota: totalQuota - totalRemaining,
          startDate: activeSubs[0].startDate,
          endDate: furthestEndDate,
          status: 'active',
          activePlansCount: activeSubs.length,
          plans: activeSubs.map((s) => ({
            id: s._id,
            planId: s.planId?._id ? s.planId._id.toString() : s.planId ? s.planId.toString() : '',
            name: s.planSnapshot?.name || s.planId?.name || '',
            tagline: s.planSnapshot?.tagline || '',
            interval: s.planSnapshot?.interval || s.planId?.interval || 'monthly',
            price: Number(s.price || s.planSnapshot?.price || 0),
            subtotal: Number(s.subtotal || s.planSnapshot?.subtotal || s.price || 0),
            gstAmount: Number(s.gstAmount || s.planSnapshot?.gstAmount || 0),
            totalAmount: Number(s.totalAmount || s.planSnapshot?.totalPayable || s.price || 0),
            cancelAtPeriodEnd: Boolean(s.cancelAtPeriodEnd),
            videoQuota: s.videoQuota || 0,
            videoQuotaRemaining: s.videoQuotaRemaining || 0,
            usedQuota: Math.max(0, (s.videoQuota || 0) - (s.videoQuotaRemaining || 0)),
            endDate: s.endDate,
            startDate: s.startDate,
            status: s.status || 'active',
          })),
          cancelAtPeriodEnd: activeSubs.every((s) => s.cancelAtPeriodEnd),
          cancelledAt: null,
          downloadedVideos: activeSubs.flatMap((s) => s.downloadedVideos || []),
        },
      },
    })
  }

  // Fallback to overview if on_hold, under_review, cancelled, or expired
  const subscription = await getUserSubscriptionOverview(user._id)

  res.json({
    success: true,
    data: {
      hasActiveSubscription: Boolean(subscription && subscription.status === 'active'),
      subscription: subscription
        ? {
            id: subscription._id,
            planName: subscription.planSnapshot?.name || subscription.planId?.name || 'Subscription Plan',
            tagline: subscription.planSnapshot?.tagline || '',
            interval: subscription.planSnapshot?.interval || 'monthly',
            price: subscription.price,
            videoQuota: subscription.videoQuota,
            videoQuotaRemaining: subscription.videoQuotaRemaining,
            usedQuota: subscription.videoQuota - subscription.videoQuotaRemaining,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            status: subscription.status,
            adminReason: subscription.adminReason || '',
            holdStartedAt: subscription.holdStartedAt || null,
            cancelAtPeriodEnd: Boolean(subscription.cancelAtPeriodEnd),
            cancelledAt: subscription.cancelledAt,
            downloadedVideos: subscription.downloadedVideos || [],
          }
        : null,
    },
  })
})

export const createCheckout = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id)
  const { planId, paymentProvider = 'razorpay', whatsappNumber, policyAgreed } = req.body

  const result = await createSubscriptionCheckout({
    user,
    planId,
    paymentProvider,
    whatsappNumber,
    policyAgreed,
  })

  res.json({
    success: true,
    message: result.directActive ? 'Subscription activated successfully' : 'Payment initiated',
    data: result,
  })
})

export const verifyPayment = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id)
  const {
    subscriptionId,
    razorpay_order_id: razorpayOrderId,
    razorpay_subscription_id: razorpaySubscriptionId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: razorpaySignature,
  } = req.body

  const subscription = await verifySubscriptionPayment({
    userId: user._id,
    subscriptionId,
    razorpayOrderId,
    razorpaySubscriptionId,
    razorpayPaymentId,
    razorpaySignature,
  })

  res.json({
    success: true,
    message: 'Subscription payment verified and activated!',
    data: {
      subscription: {
        id: subscription._id,
        planName: subscription.planSnapshot?.name || 'Active Plan',
        videoQuota: subscription.videoQuota,
        videoQuotaRemaining: subscription.videoQuotaRemaining,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
      },
    },
  })
})

export const cancelSubscription = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id)
  const { planId, subscriptionId } = req.body || {}
  const result = await cancelUserSubscription(user._id, planId || subscriptionId)
  res.json(result)
})

export const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature']
  const bodyText = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

  const isValid = verifyRazorpayWebhookSignature(bodyText, signature)
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid webhook signature' })
  }

  const { event, payload } = req.body
  const result = await handleRazorpayWebhook({ event, payload })
  res.json(result)
})

export const checkProductClaimStatus = asyncHandler(async (req, res) => {
  const user = req.user?.id ? await getUserById(req.user.id) : null
  const { productId } = req.params

  const status = await checkVideoClaimStatus({
    userId: user?._id,
    productId,
  })

  res.json({
    success: true,
    data: status,
  })
})

export const claimProduct = asyncHandler(async (req, res) => {
  const user = await getUserById(req.user.id)
  const { productId } = req.params
  const { imageSize = '', action = 'claim' } = req.body

  const result = await claimVideoWithSubscription({
    userId: user._id,
    productId,
    imageSize,
    action,
  })

  res.json(result)
})

export const getSubscriptionReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params
  const subscription = await UserSubscription.findOne({ _id: id, userId: req.user.id })
    .populate('planId')
    .populate('userId', 'name email phone')

  if (!subscription) {
    throw new AppError('Subscription receipt not found', 404)
  }

  res.json({
    success: true,
    data: {
      subscription,
    },
  })
})

export const downloadSubscriptionInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { inline } = req.query || {}
  const subscription = await UserSubscription.findById(id)
    .populate('planId')
    .populate('userId', 'name email phone')

  if (!subscription) {
    throw new AppError('Subscription receipt not found', 404)
  }

  // Security check: If authenticated non-admin user tries to access another user's invoice
  if (req.user?.id && !req.user.isAdmin && req.user.role !== 'admin') {
    const subUserId = subscription.userId?._id?.toString() || subscription.userId?.toString()
    if (subUserId && subUserId !== req.user.id) {
      throw new AppError('Access denied to this subscription invoice', 403)
    }
  }

  const user = subscription.userId || (req.user?.id ? await getUserById(req.user.id) : null)
  const buffer = buildSubscriptionCertificateBuffer(subscription, user)
  const filename = getSubscriptionCertificateFilename(subscription)

  res.setHeader('Content-Type', 'application/pdf')
  const disposition = inline === '1' || inline === 'true' ? 'inline' : 'attachment'
  res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`)
  res.send(buffer)
})
