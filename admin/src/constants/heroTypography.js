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

/** Desktop-stored positions → viewport positions for the active breakpoint */
export const resolveOverlayPositions = (slide, { compact = false } = {}) => {
  const headline = resolveOverlayPosition(slide?.headlinePosition, DEFAULT_HEADLINE_POSITION)
  const cta = resolveOverlayPosition(slide?.ctaPosition, DEFAULT_CTA_POSITION)
  const hasHeadline = Boolean(slide?.headline?.trim())
  const hasButton = Boolean(slide?.cta?.trim())

  if (!compact) {
    return { headline, cta, stacked: false }
  }

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

export const resolveHeadlineTypography = (slide, { compact = false } = {}) => {
  const px = sanitizeHeadlineFontSize(slide?.headlineFontSize)

  return {
    fontSize: compact ? toCompactFontSize(px, HERO_HEADLINE_COMPACT_MIN_PX) : toCqw(px),
    fontFamily: resolveHeroFontFamily(slide?.headlineFontFamily || DEFAULT_HEADLINE_FONT),
    fontWeight: 900,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  }
}

export const resolveCtaTypography = (slide, { compact = false } = {}) => {
  const scale = sanitizeCtaScale(slide?.ctaScale)
  const baseFont = 12
  const basePadY = compact ? 10 : 11
  const basePadX = compact ? 20 : 24
  const fontPx = Math.round(baseFont * scale)
  const padY = Math.round(basePadY * scale)
  const padX = Math.round(basePadX * scale)

  return {
    fontSize: compact
      ? toCompactFontSize(fontPx, HERO_CTA_COMPACT_MIN_PX)
      : toCqw(fontPx),
    padding: `${toCqw(padY)} ${toCqw(padX)}`,
    fontFamily: resolveHeroFontFamily(slide?.ctaFontFamily || DEFAULT_CTA_FONT),
    fontWeight: 700,
    letterSpacing: '0.06em',
    lineHeight: 1,
  }
}

export const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@700;900&family=Montserrat:wght@700;900&family=Oswald:wght@600;700&family=Playfair+Display:wght@700;900&display=swap'
