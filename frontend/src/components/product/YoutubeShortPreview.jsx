import { useCallback, useEffect, useRef, useState } from 'react'
import OptimizedImage from '../ui/OptimizedImage'
import { buildYoutubeEmbedSrc, resolveYoutubeEmbedUrl } from '../../utils/youtubeShort'
import { PROTECTED_MEDIA_CLASS } from '../../utils/mediaProtection'

const PREVIEW_AUTH_LIMIT_SECONDS = 10
const IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen'

const YoutubeShortPreview = ({
  url,
  poster,
  isAuthenticated = false,
  onPreviewLimit,
  onPlayingChange,
  autoPlay = false,
  className = 'max-h-full max-w-full',
  immersive = false,
}) => {
  const timerRef = useRef(null)
  const limitTriggeredRef = useRef(false)
  const [isActive, setIsActive] = useState(false)

  const embedUrl = resolveYoutubeEmbedUrl(url)
  const iframeSrc = isActive ? buildYoutubeEmbedSrc(url, { autoplay: true }) : ''

  const setPlaying = useCallback(
    (next) => {
      setIsActive(next)
      onPlayingChange?.(next)
    },
    [onPlayingChange],
  )

  useEffect(() => {
    limitTriggeredRef.current = false
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (autoPlay && embedUrl && !limitTriggeredRef.current) {
      setPlaying(true)
      return
    }

    setPlaying(false)
  }, [url, autoPlay, embedUrl, setPlaying])

  useEffect(() => {
    if (!isActive || isAuthenticated || !onPreviewLimit) return undefined

    timerRef.current = window.setTimeout(() => {
      if (limitTriggeredRef.current) return
      limitTriggeredRef.current = true
      setPlaying(false)
      onPreviewLimit()
    }, PREVIEW_AUTH_LIMIT_SECONDS * 1000)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isActive, isAuthenticated, onPreviewLimit, setPlaying])

  useEffect(() => {
    if (isAuthenticated) {
      limitTriggeredRef.current = false
    }
  }, [isAuthenticated])

  const handlePlay = useCallback(() => {
    if (!embedUrl || limitTriggeredRef.current) return
    setPlaying(true)
  }, [embedUrl, setPlaying])

  if (!embedUrl) {
    return (
      <div className={`flex items-center justify-center bg-black px-4 text-center text-sm text-white/70 ${className}`}>
        Invalid YouTube Short URL
      </div>
    )
  }

  return (
    <div className={`relative flex h-full w-full items-center justify-center bg-black ${className}`}>
      {isActive ? (
        <iframe
          title="YouTube Short preview"
          src={iframeSrc}
          className="h-full w-full border-0"
          allow={IFRAME_ALLOW}
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <>
          {poster ? (
            <OptimizedImage
              src={poster}
              alt="Video preview poster"
              width={1200}
              height={1200}
              quality={80}
              className={`${immersive ? 'h-full w-full object-contain' : 'max-h-full max-w-full object-contain'} ${PROTECTED_MEDIA_CLASS}`}
              loading="lazy"
            />
          ) : (
            <div className="flex h-full min-h-[280px] w-full items-center justify-center bg-slate-900 text-sm text-white/70">
              YouTube Short preview
            </div>
          )}
          <button
            type="button"
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/35"
            aria-label="Play YouTube Short preview"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/75 text-white shadow-lg sm:h-16 sm:w-16">
              <svg className="ml-1 h-7 w-7 sm:h-8 sm:w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        </>
      )}
    </div>
  )
}

export default YoutubeShortPreview
