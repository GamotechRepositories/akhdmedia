export const HERO_BANNER_DESKTOP_RATIO = '3 / 1'
export const HERO_BANNER_TABLET_RATIO = '16 / 10'
export const HERO_BANNER_MOBILE_RATIO = '16 / 10'

/** height / width — used to keep headline–button gap consistent across aspect ratios */
export const HERO_BANNER_DESKTOP_HEIGHT_RATIO = 1 / 3
export const HERO_BANNER_MOBILE_HEIGHT_RATIO = 10 / 16

/** Scale vertical offset on mobile so stored desktop positions keep the same pixel gap */
export const HERO_OVERLAY_MOBILE_Y_DELTA_SCALE =
  HERO_BANNER_DESKTOP_HEIGHT_RATIO / HERO_BANNER_MOBILE_HEIGHT_RATIO

/** Push headline slightly lower on mobile (stored positions are tuned for desktop crop) */
export const HERO_OVERLAY_MOBILE_HEADLINE_Y_BOOST = 8

/** Minimum readable sizes on small screens (cqw alone gets too tiny below ~400px) */
export const HERO_HEADLINE_COMPACT_MIN_PX = 26
export const HERO_CTA_COMPACT_MIN_PX = 12

/** Admin preview max width — overlay text scales with banner width to match live site */
export const HERO_OVERLAY_REFERENCE_WIDTH = 896

export const DEFAULT_IMAGE_FOCUS = { scale: 1, x: 50, y: 50 }

const clampFocusScale = (scale) => {
  const numeric = Number(scale)
  if (!Number.isFinite(numeric)) return DEFAULT_IMAGE_FOCUS.scale
  return Math.min(3, Math.max(1, numeric))
}

const clampFocusPercent = (value, fallback = DEFAULT_IMAGE_FOCUS.x) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(100, Math.max(0, Math.round(numeric)))
}

export const normalizeImageFocusPoint = (focus) => ({
  scale: clampFocusScale(focus?.scale),
  x: clampFocusPercent(focus?.x, DEFAULT_IMAGE_FOCUS.x),
  y: clampFocusPercent(focus?.y, DEFAULT_IMAGE_FOCUS.y),
})

/**
 * Resolve crop for a device. Desktop values live on the root object;
 * tablet/mobile may override via nested keys (fallback to desktop).
 */
export const resolveImageFocus = (focus, device = 'desktop') => {
  const desktop = normalizeImageFocusPoint(focus)
  if (device === 'tablet' && focus?.tablet) {
    return normalizeImageFocusPoint(focus.tablet)
  }
  if (device === 'mobile' && focus?.mobile) {
    return normalizeImageFocusPoint(focus.mobile)
  }
  return desktop
}
