import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    imageSize: { type: String, default: '' },
    basePrice: { type: Number, required: true, min: 0, default: 0 },
    gstPercentage: { type: Number, required: true, min: 0, default: 0 },
    gstAmount: { type: Number, required: true, min: 0, default: 0 },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
)

const appliedPromoSchema = new mongoose.Schema(
  {
    promoId: { type: mongoose.Schema.Types.ObjectId, ref: 'PromoCode', required: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    discountAmount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const cartSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
    appliedPromo: { type: appliedPromoSchema, default: null },
  },
  { timestamps: true },
)

export default mongoose.model('Cart', cartSchema)
