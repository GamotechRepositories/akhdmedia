import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, default: '', trim: true },
    password: { type: String, select: false, required: true },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },
    permissions: {
      type: [String],
      default: [],
    },
    userEmailSelection: {
      userIds: {
        type: [mongoose.Schema.Types.ObjectId],
        default: [],
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },
    loginOtpHash: { type: String, default: '', select: false },
    loginOtpExpiresAt: { type: Date, default: null, select: false },
    loginOtpSentAt: { type: Date, default: null, select: false },
    loginOtpAttempts: { type: Number, default: 0, select: false },
  },
  {
    timestamps: true,
    collection: 'admins',
  },
)

export default mongoose.model('Admin', adminSchema)
