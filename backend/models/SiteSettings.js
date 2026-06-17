import mongoose from 'mongoose'

const browseSectionSchema = new mongoose.Schema(
  {
    eyebrow: { type: String, default: 'Shot for post-production', trim: true },
    title: { type: String, default: 'Browse by Footage Type', trim: true },
  },
  { _id: false },
)

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'homepage' },
    tickerItems: {
      type: [String],
      default: [],
    },
    browseSection: {
      type: browseSectionSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
)

export default mongoose.model('SiteSettings', siteSettingsSchema)
