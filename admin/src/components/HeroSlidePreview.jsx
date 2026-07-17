import { useCallback, useRef, useState } from 'react'
import {
  DEFAULT_IMAGE_FOCUS,
  HERO_BANNER_DESKTOP_RATIO,
  HERO_BANNER_MOBILE_HINT,
  HERO_BANNER_MOBILE_RATIO,
  HERO_BANNER_RECOMMENDED,
  HERO_BANNER_TABLET_HINT,
  HERO_BANNER_TABLET_RATIO,
  HERO_BANNER_UPLOAD_GUIDE,
  IMAGE_FOCUS_ZOOM_STEP,
  MAX_IMAGE_FOCUS_SCALE,
  MIN_IMAGE_FOCUS_SCALE,
  mergeImageFocusForDevice,
  resolveImageFocus,
} from '../constants/heroBanner'
import {
  DEFAULT_CTA_POSITION,
  DEFAULT_HEADLINE_POSITION,
  resolveCtaTypography,
  resolveHeadlineTypography,
  resolveOverlayPosition,
  resolveOverlayPositions,
  storageCtaYFromMobileDrag,
  storageHeadlineYFromMobileDrag,
} from '../constants/heroTypography'

const PREVIEW_MODES = [
  {
    id: 'desktop',
    label: 'Desktop',
    aspectRatio: HERO_BANNER_DESKTOP_RATIO,
    sizeLabel: `${HERO_BANNER_RECOMMENDED.label} (${HERO_BANNER_RECOMMENDED.ratio})`,
    frameClass: 'max-w-4xl',
    compact: false,
  },
  {
    id: 'tablet',
    label: 'iPad',
    aspectRatio: HERO_BANNER_TABLET_RATIO,
    sizeLabel: `${HERO_BANNER_TABLET_HINT.label} (${HERO_BANNER_TABLET_HINT.ratio})`,
    frameClass: 'max-w-2xl',
    compact: false,
  },
  {
    id: 'mobile',
    label: 'Mobile',
    aspectRatio: HERO_BANNER_MOBILE_RATIO,
    sizeLabel: `${HERO_BANNER_MOBILE_HINT.label} (${HERO_BANNER_MOBILE_HINT.ratio})`,
    frameClass: 'max-w-sm',
    compact: true,
  },
]

const clampOverlayPercent = (value) => Math.min(95, Math.max(0, Math.round(value)))

const HeroSlidePreview = ({ slide, onImageFocusChange, onPositionChange }) => {
  const containerRef = useRef(null)
  const panState = useRef(null)
  const overlayDragState = useRef(null)
  const [isPanning, setIsPanning] = useState(false)
  const [draggingField, setDraggingField] = useState(null)
  const [previewMode, setPreviewMode] = useState('desktop')

  const hasImage = Boolean(slide.image?.trim())
  const hasHeadline = Boolean(slide.headline?.trim())
  const hasButton = Boolean(slide.cta?.trim())
  const activePreview = PREVIEW_MODES.find((mode) => mode.id === previewMode) || PREVIEW_MODES[0]
  const compact = activePreview.compact
  const imageFocus = resolveImageFocus(slide.imageFocus, previewMode)
  const { headline: headlinePosition, cta: ctaPosition, stacked } = resolveOverlayPositions(slide, {
    compact,
  })
  const headlineStyle = resolveHeadlineTypography(slide, { compact })
  const ctaStyle = resolveCtaTypography(slide, { compact })
  const ctaOffsetX = Math.max(0, ctaPosition.x - headlinePosition.x)

  const commitFocus = useCallback(
    (nextPoint) => {
      onImageFocusChange(mergeImageFocusForDevice(slide.imageFocus, previewMode, nextPoint))
    },
    [onImageFocusChange, previewMode, slide.imageFocus],
  )

  const updateFocus = useCallback(
    (patch) => {
      commitFocus({ ...imageFocus, ...patch })
    },
    [commitFocus, imageFocus],
  )

  const updateOverlayPositionFromPointer = useCallback(
    (field, clientX, clientY) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = clampOverlayPercent(((clientX - rect.left) / rect.width) * 100)
      let y = clampOverlayPercent(((clientY - rect.top) / rect.height) * 100)

      if (compact && field === 'headlinePosition') {
        y = clampOverlayPercent(storageHeadlineYFromMobileDrag(y))
      } else if (compact && field === 'ctaPosition' && stacked) {
        const storedCta = resolveOverlayPosition(slide.ctaPosition, DEFAULT_CTA_POSITION)
        onPositionChange(field, { x, y: storedCta.y })
        return
      } else if (compact && field === 'ctaPosition' && hasHeadline) {
        const headlineStorage = resolveOverlayPosition(
          slide.headlinePosition,
          DEFAULT_HEADLINE_POSITION,
        )
        y = clampOverlayPercent(storageCtaYFromMobileDrag(headlineStorage.y, y))
      }

      onPositionChange(field, { x, y })
    },
    [onPositionChange, compact, hasHeadline, stacked, slide.headlinePosition, slide.ctaPosition],
  )

  const handlePanPointerDown = (event) => {
    if (event.button !== 0) return
    event.preventDefault()
    panState.current = {
      startX: event.clientX,
      startY: event.clientY,
      initialFocus: imageFocus,
    }
    setIsPanning(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePanPointerMove = (event) => {
    if (!panState.current) return

    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const dx = event.clientX - panState.current.startX
    const dy = event.clientY - panState.current.startY
    const panStrength = 0.35 * panState.current.initialFocus.scale
    const nextX = panState.current.initialFocus.x - (dx / rect.width) * 100 * panStrength
    const nextY = panState.current.initialFocus.y - (dy / rect.height) * 100 * panStrength

    commitFocus({
      ...panState.current.initialFocus,
      x: Math.min(100, Math.max(0, Math.round(nextX))),
      y: Math.min(100, Math.max(0, Math.round(nextY))),
    })
  }

  const handlePanPointerUp = (event) => {
    if (!panState.current) return
    panState.current = null
    setIsPanning(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleOverlayPointerDown = (field) => (event) => {
    event.preventDefault()
    event.stopPropagation()
    overlayDragState.current = { field }
    setDraggingField(field)
    event.currentTarget.setPointerCapture(event.pointerId)
    updateOverlayPositionFromPointer(field, event.clientX, event.clientY)
  }

  const handleOverlayPointerMove = (event) => {
    if (!overlayDragState.current) return
    updateOverlayPositionFromPointer(
      overlayDragState.current.field,
      event.clientX,
      event.clientY,
    )
  }

  const handleOverlayPointerUp = (event) => {
    if (!overlayDragState.current) return
    overlayDragState.current = null
    setDraggingField(null)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  if (!hasImage) {
    return (
      <div className="space-y-2">
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-100/80 px-4 py-10 text-center text-sm text-slate-500">
          Upload a banner image to preview how this slide will look on the homepage.
        </div>
        <p className="text-xs leading-relaxed text-slate-500">{HERO_BANNER_UPLOAD_GUIDE}</p>
      </div>
    )
  }

  const hintByMode = {
    desktop: 'Desktop homepage uses this exact crop. Drag/zoom here to set the desktop crop.',
    tablet: `iPad preview uses ${HERO_BANNER_TABLET_HINT.ratio}. Drag/zoom here to set a separate iPad crop (falls back to desktop if unset).`,
    mobile: `Mobile preview uses ${HERO_BANNER_MOBILE_HINT.ratio}. Drag/zoom here to set a separate mobile crop (falls back to desktop if unset).`,
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Homepage preview</p>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Switch device → drag image to move · +/- zoom · drag headline &amp; button to position
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
          {PREVIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setPreviewMode(mode.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                previewMode === mode.id
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2.5 text-xs leading-relaxed text-sky-950">
        <span className="font-semibold">Recommended banner size:</span>{' '}
        {HERO_BANNER_RECOMMENDED.label} ({HERO_BANNER_RECOMMENDED.ratio} ratio).{' '}
        {hintByMode[previewMode]}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() =>
            updateFocus({
              scale: Math.min(
                MAX_IMAGE_FOCUS_SCALE,
                Math.round((imageFocus.scale + IMAGE_FOCUS_ZOOM_STEP) * 100) / 100,
              ),
            })
          }
          disabled={imageFocus.scale >= MAX_IMAGE_FOCUS_SCALE}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Zoom in
        </button>
        <button
          type="button"
          onClick={() =>
            updateFocus({
              scale: Math.max(
                MIN_IMAGE_FOCUS_SCALE,
                Math.round((imageFocus.scale - IMAGE_FOCUS_ZOOM_STEP) * 100) / 100,
              ),
            })
          }
          disabled={imageFocus.scale <= MIN_IMAGE_FOCUS_SCALE}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Zoom out
        </button>
        <button
          type="button"
          onClick={() => commitFocus({ ...DEFAULT_IMAGE_FOCUS })}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Reset {activePreview.label} crop
        </button>
        <span className="text-[11px] text-slate-500">
          {activePreview.label} zoom {Math.round(imageFocus.scale * 100)}%
        </span>
      </div>

      <div
        ref={containerRef}
        className={`relative mx-auto w-full overflow-hidden rounded-xl border border-slate-200 bg-gray-950 shadow-inner [container-type:size] ${activePreview.frameClass}`}
        style={{ aspectRatio: activePreview.aspectRatio }}
      >
        <div
          className={`absolute inset-0 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={handlePanPointerDown}
          onPointerMove={handlePanPointerMove}
          onPointerUp={handlePanPointerUp}
          onPointerCancel={handlePanPointerUp}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${imageFocus.scale})`,
              transformOrigin: `${imageFocus.x}% ${imageFocus.y}%`,
            }}
          >
            <img
              src={slide.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: `${imageFocus.x}% ${imageFocus.y}%` }}
              draggable={false}
            />
          </div>
        </div>

        {slide.showShadow ? (
          <>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-gray-900/80 via-black/50 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
          </>
        ) : null}

        {stacked ? (
          <div
            role="button"
            tabIndex={0}
            onPointerDown={handleOverlayPointerDown('headlinePosition')}
            onPointerMove={handleOverlayPointerMove}
            onPointerUp={handleOverlayPointerUp}
            onPointerCancel={handleOverlayPointerUp}
            style={{
              left: `${headlinePosition.x}%`,
              top: `${headlinePosition.y}%`,
            }}
            className={`absolute z-10 flex max-w-[88%] cursor-grab select-none touch-none flex-col items-start gap-[0.55em] ${
              draggingField === 'headlinePosition'
                ? 'cursor-grabbing ring-2 ring-sky-400 ring-offset-2 ring-offset-transparent'
                : ''
            }`}
          >
            <h3 className="m-0 p-0 text-white drop-shadow-lg" style={headlineStyle}>
              {slide.headline}
            </h3>
            <span
              role="button"
              tabIndex={0}
              onPointerDown={(event) => {
                event.stopPropagation()
                handleOverlayPointerDown('ctaPosition')(event)
              }}
              onPointerMove={handleOverlayPointerMove}
              onPointerUp={handleOverlayPointerUp}
              onPointerCancel={handleOverlayPointerUp}
              style={{
                ...ctaStyle,
                marginLeft: ctaOffsetX > 0 ? `${ctaOffsetX}%` : undefined,
              }}
              className={`inline-flex w-max max-w-none shrink-0 items-center gap-[0.35em] whitespace-nowrap rounded-full bg-white uppercase tracking-wider text-gray-900 shadow-lg ${
                draggingField === 'ctaPosition'
                  ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-transparent'
                  : ''
              }`}
            >
              {slide.cta}
            </span>
          </div>
        ) : (
          <>
            {hasHeadline ? (
              <div
                role="button"
                tabIndex={0}
                onPointerDown={handleOverlayPointerDown('headlinePosition')}
                onPointerMove={handleOverlayPointerMove}
                onPointerUp={handleOverlayPointerUp}
                onPointerCancel={handleOverlayPointerUp}
                style={{
                  left: `${headlinePosition.x}%`,
                  top: `${headlinePosition.y}%`,
                }}
                className={`absolute z-10 max-w-[70%] cursor-grab select-none touch-none ${
                  draggingField === 'headlinePosition'
                    ? 'cursor-grabbing ring-2 ring-sky-400 ring-offset-2 ring-offset-transparent'
                    : ''
                }`}
              >
                <h3 className="m-0 p-0 text-white drop-shadow-lg" style={headlineStyle}>
                  {slide.headline}
                </h3>
              </div>
            ) : null}

            {hasButton ? (
              <div
                role="button"
                tabIndex={0}
                onPointerDown={handleOverlayPointerDown('ctaPosition')}
                onPointerMove={handleOverlayPointerMove}
                onPointerUp={handleOverlayPointerUp}
                onPointerCancel={handleOverlayPointerUp}
                style={{
                  left: `${ctaPosition.x}%`,
                  top: `${ctaPosition.y}%`,
                }}
                className={`absolute z-10 cursor-grab select-none touch-none ${
                  draggingField === 'ctaPosition'
                    ? 'cursor-grabbing ring-2 ring-emerald-400 ring-offset-2 ring-offset-transparent'
                    : ''
                }`}
              >
                <span
                  className="inline-flex w-max max-w-none shrink-0 items-center gap-[0.35em] whitespace-nowrap rounded-full bg-white uppercase tracking-wider text-gray-900 shadow-lg"
                  style={ctaStyle}
                >
                  {slide.cta}
                </span>
              </div>
            ) : null}
          </>
        )}

        <div className="pointer-events-none absolute right-2 top-2 rounded-md bg-black/55 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/90">
          {activePreview.label} · {activePreview.sizeLabel}
        </div>
      </div>
    </div>
  )
}

export default HeroSlidePreview
