import mongoose from 'mongoose'

const supportRequestSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    sessionId: { type: String, default: '', index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    orderNumber: { type: String, default: '', trim: true },
    subject: {
      type: String,
      enum: ['download', 'license_email', 'payment', 'license', 'other'],
      default: 'other',
    },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    adminNotes: { type: String, default: '' },
    replies: [
      {
        message: { type: String, required: true, trim: true },
        sentAt: { type: Date, default: Date.now },
      },
    ],
    lastReplyAt: { type: Date, default: null },
  },
  { timestamps: true },
)

export default mongoose.model('SupportRequest', supportRequestSchema)
