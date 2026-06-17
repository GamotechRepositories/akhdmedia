import mongoose from 'mongoose'

const subCategorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const categorySchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    label: { type: String, required: true, trim: true },
    breadcrumb: { type: String, required: true, trim: true },
    navLabel: { type: String, required: true, trim: true },
    subCategories: { type: [subCategorySchema], default: [] },
    description: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    showInBrowseSection: { type: Boolean, default: false },
    heroBadge: { type: String, default: '' },
    heroHeadline: { type: String, default: '' },
    heroSubheadline: { type: String, default: '' },
    heroCta: { type: String, default: 'Explore' },
    heroAccent: { type: String, default: 'from-gray-900/80 via-black/50 to-transparent' },
    featuredTitle: { type: String, default: '' },
    featuredSubtitle: { type: String, default: '' },
    featuredGradient: { type: String, default: 'from-gray-900/70 to-transparent' },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export default mongoose.model('Category', categorySchema)
