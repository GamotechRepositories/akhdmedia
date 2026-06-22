import mongoose from 'mongoose'

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: { type: String, default: '', trim: true },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      default: 'percentage',
    },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0, min: 0 },
    maxUses: { type: Number, default: null, min: 1 },
    maxUsesPerUser: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model('PromoCode', promoCodeSchema)
