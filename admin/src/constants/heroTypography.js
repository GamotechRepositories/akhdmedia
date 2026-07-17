import {
  HERO_CTA_COMPACT_MIN_PX,
  HERO_HEADLINE_COMPACT_MIN_PX,
  HERO_OVERLAY_MOBILE_HEADLINE_Y_BOOST,
  HERO_OVERLAY_MOBILE_Y_DELTA_SCALE,
  HERO_OVERLAY_REFERENCE_WIDTH,
} from './heroBanner'

export const DEFAULT_HEADLINE_FONT_SIZE = 48
export const DEFAULT_CTA_SCALE = 1
export const DEFAULT_HEADLINE_FONT = 'system'
export const DEFAULT_CTA_FONT = 'system'
export const DEFAULT_HEADLINE_POSITION = { x: 5, y: 62 }
export const DEFAULT_CTA_POSITION = { x: 5, y: 78 }

export const HERO_EDIT_DEVICES = [
  { id: 'desktop', label: 'Desktop' },
  { id: 'tablet', label: 'iPad' },
  { id: 'mobile', label: 'Mobile' },
]

export const HERO_FONT_OPTIONS = [
  {
    id: 'system',
    label: 'System default',
    family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  {
    id: 'inter',
    label: 'Inter',
    family: "'Inter', sans-serif",
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    family: "'Montserrat', sans-serif",
  },
  {
    id: 'oswald',
    label: 'Oswald',
    family: "'Oswald', sans-serif",
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    family: "'Playfair Display', serif",
  },
  {
    id: 'georgia',
    label: 'Georgia',
    family: "Georgia, 'Times New Roman', serif",
  },
  {
    id: 'impact',
    label: 'Impact',
    family: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
  },
]

const FONT_ID_SET = new Set(HERO_FONT_OPTIONS.map((option) => option.id))

const toCqw = (px) => `${(px / HERO_OVERLAY_REFERENCE_WIDTH) * 100}cqw`

const toCompactFontSize = (px, minPx) => `clamp(${minPx}px, ${toCqw(px)}, 999px)`

export const resolveHeroFontFamily = (fontId = DEFAULT_HEADLINE_FONT) => {
  const match = HERO_FONT_OPTIONS.find((option) => option.id === fontId)
  return match?.family || HERO_FONT_OPTIONS[0].family
}

export const sanitizeHeroFontId = (value, fallback = DEFAULT_HEADLINE_FONT) => {
  const id = String(value || '').trim()
  return FONT_ID_SET.has(id) ? id : fallback
}

export const sanitizeHeadlineFontSize = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return DEFAULT_HEADLINE_FONT_SIZE
  return Math.min(96, Math.max(20, Math.round(numeric)))
}

export const sanitizeCtaScale = (value) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return DEFAULT_CTA_SCALE
  return Math.min(1.8, Math.max(0.6, Math.round(numeric * 100) / 100))
}

export const resolveOverlayPosition = (position, fallback) => {
  const x = Number(position?.x)
  const y = Number(position?.y)

  return {
    x: Number.isFinite(x) ? Math.min(95, Math.max(0, x)) : fallback.x,
    y: Number.isFinite(y) ? Math.min(95, Math.max(0, y)) : fallback.y,
  }
}

/** Desktop root styles + optional tablet/mobile overrides */
export const resolveDeviceStyle = (slide, device = 'desktop') => {
  const desktop = {
    headlineFontSize: sanitizeHeadlineFontSize(slide?.headlineFontSize),
    headlineFontFamily: sanitizeHeroFontId(slide?.headlineFontFamily, DEFAULT_HEADLINE_FONT),
    ctaScale: sanitizeCtaScale(slide?.ctaScale),
    ctaFontFamily: sanitizeHeroFontId(slide?.ctaFontFamily, DEFAULT_CTA_FONT),
    headlinePosition: resolveOverlayPosition(slide?.headlinePosition, DEFAULT_HEADLINE_POSITION),
    ctaPosition: resolveOverlayPosition(slide?.ctaPosition, DEFAULT_CTA_POSITION),
  }

  if (device === 'desktop') return { ...desktop, hasPositionOverride: true }

  const override = slide?.deviceStyles?.[device]
  if (!override || typeof override !== 'object') {
    return { ...desktop, hasPositionOverride: false }
  }

  return {
    headlineFontSize:
      override.headlineFontSize != null
        ? sanitizeHeadlineFontSize(override.headlineFontSize)
        : desktop.headlineFontSize,
    headlineFontFamily:
      override.headlineFontFamily != null
        ? sanitizeHeroFontId(override.headlineFontFamily, desktop.headlineFontFamily)
        : desktop.headlineFontFamily,
    ctaScale:
      override.ctaScale != null ? sanitizeCtaScale(override.ctaScale) : desktop.ctaScale,
    ctaFontFamily:
      override.ctaFontFamily != null
        ? sanitizeHeroFontId(override.ctaFontFamily, desktop.ctaFontFamily)
        : desktop.ctaFontFamily,
    headlinePosition: override.headlinePosition
      ? resolveOverlayPosition(override.headlinePosition, desktop.headlinePosition)
      : desktop.headlinePosition,
    ctaPosition: override.ctaPosition
      ? resolveOverlayPosition(override.ctaPosition, desktop.ctaPosition)
      : desktop.ctaPosition,
    hasPositionOverride: Boolean(override.headlinePosition || override.ctaPosition),
  }
}

/** Apply typography/position patch for a device onto a slide object */
export const applyDeviceStylePatch = (slide, device, patch = {}) => {
  if (device === 'desktop') {
    const next = { ...slide }
    if (patch.headlineFontSize != null) next.headlineFontSize = sanitizeHeadlineFontSize(patch.headlineFontSize)
    if (patch.headlineFontFamily != null) {
      next.headlineFontFamily = sanitizeHeroFontId(patch.headlineFontFamily)
    }
    if (patch.ctaScale != null) next.ctaScale = sanitizeCtaScale(patch.ctaScale)
    if (patch.ctaFontFamily != null) next.ctaFontFamily = sanitizeHeroFontId(patch.ctaFontFamily, DEFAULT_CTA_FONT)
    if (patch.headlinePosition != null) {
      next.headlinePosition = resolveOverlayPosition(patch.headlinePosition, DEFAULT_HEADLINE_POSITION)
    }
    if (patch.ctaPosition != null) {
      next.ctaPosition = resolveOverlayPosition(patch.ctaPosition, DEFAULT_CTA_POSITION)
    }
    return next
  }

  const existing = slide?.deviceStyles?.[device] || {}
  const nextOverride = { ...existing }

  if (patch.headlineFontSize != null) {
    nextOverride.headlineFontSize = sanitizeHeadlineFontSize(patch.headlineFontSize)
  }
  if (patch.headlineFontFamily != null) {
    nextOverride.headlineFontFamily = sanitizeHeroFontId(patch.headlineFontFamily)
  }
  if (patch.ctaScale != null) nextOverride.ctaScale = sanitizeCtaScale(patch.ctaScale)
  if (patch.ctaFontFamily != null) {
    nextOverride.ctaFontFamily = sanitizeHeroFontId(patch.ctaFontFamily, DEFAULT_CTA_FONT)
  }
  if (patch.headlinePosition != null) {
    nextOverride.headlinePosition = resolveOverlayPosition(
      patch.headlinePosition,
      DEFAULT_HEADLINE_POSITION,
    )
  }
  if (patch.ctaPosition != null) {
    nextOverride.ctaPosition = resolveOverlayPosition(patch.ctaPosition, DEFAULT_CTA_POSITION)
  }

  return {
    ...slide,
    deviceStyles: {
      ...(slide?.deviceStyles || {}),
      [device]: nextOverride,
    },
  }
}

/** Desktop-stored positions → viewport positions for the active breakpoint */
export const resolveOverlayPositions = (slide, { compact = false, device = 'desktop' } = {}) => {
  const style = resolveDeviceStyle(slide, device)
  const headline = style.headlinePosition
  const cta = style.ctaPosition
  const hasHeadline = Boolean(slide?.headline?.trim())
  const hasButton = Boolean(slide?.cta?.trim())

  if (!compact) {
    return { headline, cta, stacked: false }
  }

  // Mobile with its own saved positions — use them directly (stacked)
  if (style.hasPositionOverride) {
    return {
      headline,
      cta,
      stacked: hasHeadline && hasButton,
    }
  }

  // Fallback: derive mobile layout from desktop positions
  const boostedHeadline = {
    x: headline.x,
    y: Math.min(92, headline.y + HERO_OVERLAY_MOBILE_HEADLINE_Y_BOOST),
  }

  return {
    headline: boostedHeadline,
    cta,
    stacked: hasHeadline && hasButton,
  }
}

/** Convert mobile preview drag coordinates back to desktop-stored headline Y */
export const storageHeadlineYFromMobileDrag = (draggedY) =>
  Math.min(95, Math.max(0, draggedY - HERO_OVERLAY_MOBILE_HEADLINE_Y_BOOST))

/** Convert mobile preview drag coordinates back to desktop-stored CTA Y */
export const storageCtaYFromMobileDrag = (headlineY, draggedY) => {
  const yDelta = draggedY - headlineY
  return Math.min(95, Math.max(headlineY, headlineY + yDelta / HERO_OVERLAY_MOBILE_Y_DELTA_SCALE))
}

export const resolveHeadlineTypography = (slide, { compact = false, device = 'desktop' } = {}) => {
  const style = resolveDeviceStyle(slide, device)
  const px = style.headlineFontSize

  return {
    fontSize: compact ? toCompactFontSize(px, HERO_HEADLINE_COMPACT_MIN_PX) : toCqw(px),
    fontFamily: resolveHeroFontFamily(style.headlineFontFamily),
    fontWeight: 900,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  }
}

export const resolveCtaTypography = (slide, { compact = false, device = 'desktop' } = {}) => {
  const style = resolveDeviceStyle(slide, device)
  const scale = style.ctaScale
  const baseFont = 12
  const basePadY = compact ? 10 : 11
  const basePadX = compact ? 20 : 24
  const fontPx = Math.round(baseFont * scale)
  const padY = Math.round(basePadY * scale)
  const padX = Math.round(basePadX * scale)

  return {
    fontSize: compact ? toCompactFontSize(fontPx, HERO_CTA_COMPACT_MIN_PX) : toCqw(fontPx),
    padding: `${toCqw(padY)} ${toCqw(padX)}`,
    fontFamily: resolveHeroFontFamily(style.ctaFontFamily),
    fontWeight: 700,
    letterSpacing: '0.06em',
    lineHeight: 1,
  }
}

export const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@700;900&family=Montserrat:wght@700;900&family=Oswald:wght@600;700&family=Playfair+Display:wght@700;900&display=swap'
