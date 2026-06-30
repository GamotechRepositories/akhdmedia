import mongoose from 'mongoose'

const userEmailLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    userName: {
      type: String,
      default: '',
      trim: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    adminName: {
      type: String,
      default: '',
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    target: {
      type: String,
      enum: ['all', 'selected', 'single'],
      default: 'selected',
    },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent',
      index: true,
    },
    errorMessage: {
      type: String,
      default: '',
      trim: true,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true },
)

userEmailLogSchema.index({ userId: 1, sentAt: -1 })

export default mongoose.model('UserEmailLog', userEmailLogSchema)
