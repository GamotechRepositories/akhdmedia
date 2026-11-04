import mongoose from 'mongoose'

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    interval: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
      index: true,
    },
    durationDays: {
      type: Number,
      required: true,
      default: 30,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    gstPercentage: {
      type: Number,
      default: 18,
      min: 0,
      max: 100,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
      trim: true,
    },
    videoQuota: {
      type: Number,
      required: true,
      default: 20,
      min: 0,
    },
    razorpayPlanId: {
      type: String,
      default: '',
      trim: true,
    },
    features: {
      type: [String],
      default: [],
    },
    badge: {
      type: String,
      default: '',
      trim: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  { timestamps: true },
)

export default mongoose.model('SubscriptionPlan', subscriptionPlanSchema)

