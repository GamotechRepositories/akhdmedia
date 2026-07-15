import mongoose from 'mongoose'

const deletedAccountSchema = new mongoose.Schema(
  {
    originalUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, default: '', trim: true },
    reason: { type: String, required: true, trim: true },
    accountCreatedAt: { type: Date, default: null },
    deletedBy: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    deletedByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    deletedByAdminName: { type: String, default: '', trim: true },
    deletedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
)

export default mongoose.model('DeletedAccount', deletedAccountSchema)
