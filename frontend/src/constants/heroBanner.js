export const HERO_BANNER_DESKTOP_RATIO = '3 / 1'
export const HERO_BANNER_MOBILE_RATIO = '16 / 10'
export const HERO_BANNER_TABLET_RATIO = '16 / 10'

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

export const resolveImageFocus = (focus) => {
  const scale = Number(focus?.scale)

  return {
    scale: Number.isFinite(scale) ? Math.min(3, Math.max(1, scale)) : DEFAULT_IMAGE_FOCUS.scale,
    x: Number.isFinite(Number(focus?.x)) ? Number(focus.x) : DEFAULT_IMAGE_FOCUS.x,
    y: Number.isFinite(Number(focus?.y)) ? Number(focus.y) : DEFAULT_IMAGE_FOCUS.y,
  }
}
