export const HERO_BANNER_DESKTOP_RATIO = '3 / 1'
export const HERO_BANNER_MOBILE_RATIO = '16 / 10'

export const HERO_BANNER_RECOMMENDED = {
  width: 2400,
  height: 800,
  label: '2400 × 800 px',
  ratio: '3:1',
}

export const HERO_BANNER_MOBILE_HINT = {
  width: 1600,
  height: 1000,
  label: '1600 × 1000 px',
  ratio: '16:10',
}

export const HERO_BANNER_UPLOAD_GUIDE =
  'Upload a wide landscape image at 2400 × 800 px (3:1). Keep headline, faces, and key action inside the center area — mobile uses a taller crop from the same file.'

/** Admin preview max width — overlay text scales with banner width to match live site */
export const HERO_OVERLAY_REFERENCE_WIDTH = 896

export const DEFAULT_IMAGE_FOCUS = { scale: 1, x: 50, y: 50 }
export const MIN_IMAGE_FOCUS_SCALE = 1
export const MAX_IMAGE_FOCUS_SCALE = 2.5
export const IMAGE_FOCUS_ZOOM_STEP = 0.1
