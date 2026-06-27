export const HERO_BANNER_DESKTOP_RATIO = '3 / 1'
export const HERO_BANNER_MOBILE_RATIO = '16 / 10'
export const HERO_BANNER_TABLET_RATIO = '16 / 10'

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
