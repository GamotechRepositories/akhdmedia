import mongoose from 'mongoose'

const pendingRegistrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    otpHash: { type: String, required: true, select: false },
    otpExpires: { type: Date, required: true },
    lastOtpSentAt: { type: Date },
  },
  { timestamps: true },
)

pendingRegistrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 })

export default mongoose.model('PendingRegistration', pendingRegistrationSchema)
