import mongoose from 'mongoose'

const billingAddressSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    zipCode: { type: String, default: '' },
    country: { type: String, default: 'India' },
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
