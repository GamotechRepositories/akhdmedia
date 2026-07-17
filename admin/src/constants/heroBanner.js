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

export const HERO_BANNER_RECOMMENDED = {
  width: 2400,
  height: 800,
  label: '2400 × 800 px',
  ratio: '3:1',
}

export const HERO_BANNER_TABLET_HINT = {
  width: 1600,
  height: 1000,
  label: '1600 × 1000 px',
  ratio: '16:10',
}

export const HERO_BANNER_MOBILE_HINT = {
  width: 1600,
  height: 1000,
  label: '1600 × 1000 px',
  ratio: '16:10',
}

export const HERO_BANNER_UPLOAD_GUIDE =
  'Upload a wide landscape image at 2400 × 800 px (3:1). Keep headline, faces, and key action inside the center area — iPad and mobile use a taller crop from the same file (you can set each crop in Live preview).'

/** Admin preview max width — overlay text scales with banner width to match live site */
export const HERO_OVERLAY_REFERENCE_WIDTH = 896

export const DEFAULT_IMAGE_FOCUS = { scale: 1, x: 50, y: 50 }
export const MIN_IMAGE_FOCUS_SCALE = 1
export const MAX_IMAGE_FOCUS_SCALE = 2.5
export const IMAGE_FOCUS_ZOOM_STEP = 0.1

const clampFocusScale = (scale) => {
  const numeric = Number(scale)
  if (!Number.isFinite(numeric)) return DEFAULT_IMAGE_FOCUS.scale
  return Math.min(MAX_IMAGE_FOCUS_SCALE, Math.max(MIN_IMAGE_FOCUS_SCALE, numeric))
}

const clampFocusPercent = (value, fallback = DEFAULT_IMAGE_FOCUS.x) => {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(100, Math.max(0, Math.round(numeric)))
}

/** Normalize a single focus point { scale, x, y } */
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

/** Merge a device-specific crop into the stored imageFocus object */
export const mergeImageFocusForDevice = (currentFocus, device, nextPoint) => {
  const desktop = normalizeImageFocusPoint(currentFocus)
  const point = normalizeImageFocusPoint(nextPoint)
  const tablet = currentFocus?.tablet
    ? normalizeImageFocusPoint(currentFocus.tablet)
    : undefined
  const mobile = currentFocus?.mobile
    ? normalizeImageFocusPoint(currentFocus.mobile)
    : undefined

  if (device === 'tablet') {
    return {
      ...desktop,
      tablet: point,
      ...(mobile ? { mobile } : {}),
    }
  }
  if (device === 'mobile') {
    return {
      ...desktop,
      ...(tablet ? { tablet } : {}),
      mobile: point,
    }
  }
  return {
    ...point,
    ...(tablet ? { tablet } : {}),
    ...(mobile ? { mobile } : {}),
  }
}
