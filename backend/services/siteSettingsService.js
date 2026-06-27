import SiteSettings from '../models/SiteSettings.js'
import AppError from '../utils/AppError.js'
import {
  HOME_PIN_LIMIT,
  loadPinnedProductMap,
  normalizePinnedProductIds,
  serializePinnedProducts,
  validatePinnedProductsExist,
} from '../utils/homePinnedProducts.js'

const HERO_FONT_IDS = new Set([
  'system',
  'inter',
  'montserrat',
  'oswald',
  'playfair',
  'georgia',
  'impact',
])

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
    title: 'Browse by Editorial Footage Type',
  },
  heroSlides: [],
  showActorsSection: true,
  homeLatestProductIds: [],
}

const sanitizeTickerItems = (items = []) =>
  items
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .slice(0, 12)

const clampOverlayPercent = (value, fallback) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(95, Math.max(0, Math.round(numeric)))
}

const sanitizeOverlayPosition = (position, fallback) => ({
  x: clampOverlayPercent(position?.x, fallback.x),
  y: clampOverlayPercent(position?.y, fallback.y),
})

const clampImageFocusPercent = (value, fallback) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(100, Math.max(0, Math.round(numeric)))
}

const sanitizeImageFocus = (focus) => {
  const scale = Number(focus?.scale)
  return {
    scale: Number.isFinite(scale)
      ? Math.min(3, Math.max(1, Math.round(scale * 100) / 100))
      : 1,
    x: clampImageFocusPercent(focus?.x, 50),
    y: clampImageFocusPercent(focus?.y, 50),
  }
}

const sanitizeHeroFontId = (value, fallback = 'system') => {
  const id = String(value || '').trim()
  return HERO_FONT_IDS.has(id) ? id : fallback
}

const sanitizeHeadlineFontSize = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 48
  return Math.min(96, Math.max(20, Math.round(numeric)))
}

const sanitizeCtaScale = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 1
  return Math.min(1.8, Math.max(0.6, Math.round(numeric * 100) / 100))
}

const sanitizeHeroSlides = (slides = []) =>
  slides
    .map((slide) => ({
      badge: String(slide?.badge || '').trim(),
      headline: String(slide?.headline || '').trim(),
      cta: String(slide?.cta || '').trim(),
      link: String(slide?.link || '').trim(),
      image: String(slide?.image || '').trim(),
      accent:
        String(slide?.accent || 'from-gray-900/80 via-black/50 to-transparent').trim() ||
        'from-gray-900/80 via-black/50 to-transparent',
      headlinePosition: sanitizeOverlayPosition(slide?.headlinePosition, { x: 5, y: 62 }),
      ctaPosition: sanitizeOverlayPosition(slide?.ctaPosition, { x: 5, y: 78 }),
      imageFocus: sanitizeImageFocus(slide?.imageFocus),
      headlineFontSize: sanitizeHeadlineFontSize(slide?.headlineFontSize),
      headlineFontFamily: sanitizeHeroFontId(slide?.headlineFontFamily),
      ctaScale: sanitizeCtaScale(slide?.ctaScale),
      ctaFontFamily: sanitizeHeroFontId(slide?.ctaFontFamily),
      isActive: slide?.isActive !== false,
      showShadow: slide?.showShadow === true,
    }))
    .slice(0, 8)

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

    if (!eyebrow) {
      throw new AppError('Browse section eyebrow text is required', 400)
    }

    const current = await getSiteSettings()
    updates.browseSection = {
      eyebrow,
      title: current.browseSection?.title || DEFAULT_SITE_SETTINGS.browseSection.title,
    }
  }

  if (payload.heroSlides !== undefined) {
    const heroSlides = sanitizeHeroSlides(payload.heroSlides)
    updates.heroSlides = heroSlides
  }

  if (payload.showActorsSection !== undefined) {
    updates.showActorsSection = payload.showActorsSection !== false
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

export const formatSiteSettings = (settings, productMap = null) => {
  const homeLatestProductIds = (settings.homeLatestProductIds || []).map((id) => id.toString())

  return {
    tickerItems: settings.tickerItems,
    browseSection: settings.browseSection,
    heroSlides: settings.heroSlides?.length
      ? settings.heroSlides
      : DEFAULT_SITE_SETTINGS.heroSlides,
    showActorsSection: settings.showActorsSection !== false,
    homeLatestProductIds,
    homeLatestProducts: productMap
      ? serializePinnedProducts(settings.homeLatestProductIds, productMap)
      : undefined,
  }
}

export const updateHomeLatestProductIds = async (rawIds = []) => {
  const normalized = normalizePinnedProductIds(rawIds, { limit: HOME_PIN_LIMIT })
  if (normalized.error) {
    throw new AppError(normalized.error, 400)
  }

  const validated = await validatePinnedProductsExist(normalized.productIds)
  if (validated.error) {
    throw new AppError(validated.error, 400)
  }

  const settings = await SiteSettings.findOneAndUpdate(
    { key: 'homepage' },
    { $set: { homeLatestProductIds: validated.productIds } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  )

  const productMap = await loadPinnedProductMap([settings.homeLatestProductIds])

  return {
    settings,
    pinnedProducts: serializePinnedProducts(settings.homeLatestProductIds, productMap),
  }
}
