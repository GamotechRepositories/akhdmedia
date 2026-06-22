import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
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
    password: { type: String, select: false, default: '' },
    googleId: { type: String, unique: true, sparse: true, trim: true },
    passwordResetToken: { type: String, select: false, default: '' },
    passwordResetExpires: { type: Date, select: false },
    role: {
      type: String,
      default: 'user',
    },
  },
  { timestamps: true },
)

export default mongoose.model('User', userSchema)
