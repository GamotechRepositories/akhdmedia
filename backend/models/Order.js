import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    clipId: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    name: { type: String, required: true },
    brand: { type: String, default: '' },
    imageSize: { type: String, default: '' },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    basePrice: { type: Number, required: true, min: 0, default: 0 },
    gstPercentage: { type: Number, required: true, min: 0, default: 0 },
    gstAmount: { type: Number, required: true, min: 0, default: 0 },
    price: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const billingAddressSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    purchaseReasons: { type: [String], default: [] },
    purchaseReasonOther: { type: String, default: '' },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, default: null },
    orderNumber: { type: String, required: true, unique: true, index: true },
    items: { type: [orderItemSchema], default: [] },
    billingAddress: { type: billingAddressSchema, required: true },
    paymentMethod: {
      type: String,
      enum: ['online', 'COD'],
      default: 'online',
    },
    paymentProvider: {
      type: String,
      enum: ['razorpay', 'paypal'],
      default: 'razorpay',
    },
    subtotalAmount: { type: Number, required: true, min: 0, default: 0 },
    gstAmount: { type: Number, required: true, min: 0, default: 0 },
    promoCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'invoice'],
      default: 'pending',
    },
    razorpayOrderId: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    paypalOrderId: { type: String, default: '' },
    paypalCaptureId: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed'],
      default: 'confirmed',
    },
    licenseEmailResendCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
)

export default mongoose.model('Order', orderSchema)
