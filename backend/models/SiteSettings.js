import mongoose from 'mongoose'

const browseSectionSchema = new mongoose.Schema(
  {
    eyebrow: { type: String, default: 'Shot for post-production', trim: true },
    title: { type: String, default: 'Browse by Editorial Footage Type', trim: true },
  },
  { _id: false },
)

const heroSlideSchema = new mongoose.Schema(
  {
    badge: { type: String, default: '', trim: true },
    headline: { type: String, default: '', trim: true },
    cta: { type: String, default: '', trim: true },
    link: { type: String, default: '', trim: true },
    image: { type: String, default: '', trim: true },
    accent: {
      type: String,
      default: 'from-gray-900/80 via-black/50 to-transparent',
      trim: true,
    },
    isActive: { type: Boolean, default: true },
    showShadow: { type: Boolean, default: false },
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
    heroSlides: {
      type: [heroSlideSchema],
      default: [],
    },
    showActorsSection: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model('SiteSettings', siteSettingsSchema)
