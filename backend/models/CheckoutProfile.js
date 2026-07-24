import mongoose from 'mongoose'

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

const checkoutProfileSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    billingAddress: { type: billingAddressSchema, default: () => ({}) },
  },
  { timestamps: true },
)

export default mongoose.model('CheckoutProfile', checkoutProfileSchema)
           