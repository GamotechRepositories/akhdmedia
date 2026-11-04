import mongoose from 'mongoose'

const claimedVideoSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    clipId: { type: String, default: '' },
    name: { type: String, default: '' },
    imageSize: { type: String, default: '' },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    orderNumber: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    claimedAt: { type: Date, default: Date.now },
  },
  { _id: true },
)

const userSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
      index: true,
    },
    planSnapshot: {
      name: { type: String, default: '' },
      tagline: { type: String, default: '' },
      interval: { type: String, default: 'monthly' },
      price: { type: Number, default: 0 },
      subtotal: { type: Number, default: 0 },
      gstPercentage: { type: Number, default: 0 },
      gstAmount: { type: Number, default: 0 },
      totalPayable: { type: Number, default: 0 },
      videoQuota: { type: Number, default: 0 },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstPercentage: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    videoQuota: {
      type: Number,
      required: true,
      min: 0,
    },
    videoQuotaRemaining: {
      type: Number,
      required: true,
      min: 0,
    },
    downloadedVideos: {
      type: [claimedVideoSchema],
      default: [],
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled'],
      default: 'pending',
      index: true,
    },
    paymentProvider: {
      type: String,
      enum: ['razorpay', 'paypal', 'admin_manual', 'free'],
      default: 'razorpay',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    razorpayOrderId: { type: String, default: '' },
    razorpaySubscriptionId: { type: String, default: '', index: true },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelledAt: { type: Date, default: null },
    currentCycle: { type: Number, default: 1 },
    paypalSubscriptionId: { type: String, default: '', index: true },
    paypalPlanId: { type: String, default: '' },
    paypalCurrency: { type: String, default: 'USD' },
    paypalAmount: { type: Number, default: 0 },
    paypalLastPaymentAt: { type: Date, default: null },
    paypalLastPaymentId: { type: String, default: '' },
    paypalFrequency: { unit: String, count: Number },
    paypalOrderId: { type: String, default: '' },
    paypalCaptureId: { type: String, default: '' },
    whatsappNumber: { type: String, default: '', trim: true },
    policyAgreed: { type: Boolean, default: false },
    policyAgreedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

userSubscriptionSchema.index({ userId: 1, status: 1 })

export default mongoose.model('UserSubscription', userSubscriptionSchema)

