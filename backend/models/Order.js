import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String, default: '' },
    imageSize: { type: String, default: '' },
    image: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
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
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    items: { type: [orderItemSchema], default: [] },
    billingAddress: { type: billingAddressSchema, required: true },
    paymentMethod: {
      type: String,
      enum: ['online', 'COD'],
      default: 'online',
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed'],
      default: 'confirmed',
    },
  },
  { timestamps: true },
)

export default mongoose.model('Order', orderSchema)
