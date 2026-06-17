import SiteSettings from '../models/SiteSettings.js'
import AppError from '../utils/AppError.js'

export const DEFAULT_SITE_SETTINGS = {
  key: 'homepage',
  tickerItems: [
    '4K UHD & 2K DELIVERABLES ON EVERY CLIP',
    'WATERMARKED PREVIEW — FULL RES AFTER CHECKOUT',
    'COMMERCIAL LICENSE INCLUDED',
    'NEW FOOTAGE UPLOADED EVERY WEEK',
    'PRORES & H.265 MASTER FILES AVAILABLE',
  ],
  browseSection: {
    eyebrow: 'Shot for post-production',
    title: 'Browse by Footage Type',
  },
}

const sanitizeTickerItems = (items = []) =>
  items
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 12)

export const getSiteSettings = async () => {
  let settings = await SiteSettings.findOne({ key: 'homepage' })

  if (!settings) {
    settings = await SiteSettings.create(DEFAULT_SITE_SETTINGS)
  }

  return settings
}

export const updateSiteSettings = async (payload = {}) => {
  const updates = {}

  if (payload.tickerItems !== undefined) {
    const tickerItems = sanitizeTickerItems(payload.tickerItems)
    if (!tickerItems.length) {
      throw new AppError('At least one ticker message is required', 400)
    }
    updates.tickerItems = tickerItems
  }

  if (payload.browseSection !== undefined) {
    const eyebrow = String(payload.browseSection.eyebrow || '').trim()
    const title = String(payload.browseSection.title || '').trim()

    if (!eyebrow || !title) {
      throw new AppError('Browse section eyebrow and title are required', 400)
    }

    updates.browseSection = { eyebrow, title }
  }

  if (!Object.keys(updates).length) {
    throw new AppError('No valid site content updates provided', 400)
  }

  const settings = await SiteSettings.findOneAndUpdate(
    { key: 'homepage' },
    { $set: updates },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  )

  return settings
}

export const formatSiteSettings = (settings) => ({
  tickerItems: settings.tickerItems,
  browseSection: settings.browseSection,
})
