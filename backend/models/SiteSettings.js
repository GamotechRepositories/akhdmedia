import mongoose from 'mongoose'

const browseSectionSchema = new mongoose.Schema(
  {
    eyebrow: { type: String, default: 'Shot for post-production', trim: true },
    title: { type: String, default: 'Browse by Editorial Footage Type', trim: true },
  },
  { _id: false },
)

const overlayPositionSchema = new mongoose.Schema(
  {
    x: { type: Number, default: 5, min: 0, max: 100 },
    y: { type: Number, default: 62, min: 0, max: 100 },
  },
  { _id: false },
)

const imageFocusSchema = new mongoose.Schema(
  {
    scale: { type: Number, default: 1, min: 1, max: 3 },
    x: { type: Number, default: 50, min: 0, max: 100 },
    y: { type: Number, default: 50, min: 0, max: 100 },
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
    headlinePosition: {
      type: overlayPositionSchema,
      default: () => ({ x: 5, y: 62 }),
    },
    ctaPosition: {
      type: overlayPositionSchema,
      default: () => ({ x: 5, y: 78 }),
    },
    imageFocus: {
      type: imageFocusSchema,
      default: () => ({ scale: 1, x: 50, y: 50 }),
    },
    headlineFontSize: { type: Number, default: 48, min: 20, max: 96 },
    headlineFontFamily: { type: String, default: 'system', trim: true },
    ctaScale: { type: Number, default: 1, min: 0.6, max: 1.8 },
    ctaFontFamily: { type: String, default: 'system', trim: true },
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
    homeLatestProductIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      default: [],
    },
  },
  { timestamps: true },
)

export default mongoose.model('SiteSettings', siteSettingsSchema)
