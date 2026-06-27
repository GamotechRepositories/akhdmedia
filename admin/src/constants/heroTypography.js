import { HERO_OVERLAY_REFERENCE_WIDTH } from './heroBanner'

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

const toCqw = (px, compact = false) =>
  `${((px * (compact ? 0.55 : 1)) / HERO_OVERLAY_REFERENCE_WIDTH) * 100}cqw`

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

export const resolveHeadlineTypography = (slide, { compact = false } = {}) => ({
  fontSize: toCqw(sanitizeHeadlineFontSize(slide?.headlineFontSize), compact),
  fontFamily: resolveHeroFontFamily(slide?.headlineFontFamily || DEFAULT_HEADLINE_FONT),
  fontWeight: 900,
  lineHeight: 1.1,
  letterSpacing: '-0.02em',
})

export const resolveCtaTypography = (slide, { compact = false } = {}) => {
  const scale = sanitizeCtaScale(slide?.ctaScale)
  const baseFont = compact ? 10 : 12
  const basePadY = compact ? 8 : 11
  const basePadX = compact ? 16 : 24
  const fontPx = Math.round(baseFont * scale)
  const padY = Math.round(basePadY * scale)
  const padX = Math.round(basePadX * scale)

  return {
    fontSize: toCqw(fontPx, compact),
    padding: `${toCqw(padY, compact)} ${toCqw(padX, compact)}`,
    fontFamily: resolveHeroFontFamily(slide?.ctaFontFamily || DEFAULT_CTA_FONT),
    fontWeight: 700,
    letterSpacing: '0.06em',
    lineHeight: 1,
  }
}

export const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Inter:wght@700;900&family=Montserrat:wght@700;900&family=Oswald:wght@600;700&family=Playfair+Display:wght@700;900&display=swap'
