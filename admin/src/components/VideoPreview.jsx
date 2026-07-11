import { useEffect, useRef, useState } from 'react'

const waitForVideoReady = (video) =>
  new Promise((resolve) => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      resolve()
      return
    }

    const onReady = () => resolve()
    video.addEventListener('canplay', onReady, { once: true })
    video.addEventListener('error', onReady, { once: true })
    window.setTimeout(onReady, 10000)
  })

const VideoPreview = ({ src, poster }) => {
  const videoRef = useRef(null)
  const loadedSrcRef = useRef('')
  const [activeSrc, setActiveSrc] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadedSrcRef.current = ''
    setActiveSrc('')
    setIsPlaying(false)
    setIsLoading(false)

    const video = videoRef.current
    if (video) {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [src])

  const handleTogglePlay = async () => {
    if (!src || isLoading) return

    const video = videoRef.current
    if (!video) return

    if (loadedSrcRef.current && !video.paused && !video.ended) {
      video.pause()
      setIsPlaying(false)
      return
    }

    setIsLoading(true)
    try {
      if (loadedSrcRef.current !== src) {
        loadedSrcRef.current = src
        setActiveSrc(src)
        video.src = src
        video.load()
        await waitForVideoReady(video)
      }

      await video.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (!src) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
        Add a demo video URL to preview playback
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-black">
      <video
        ref={videoRef}
        poster={poster || undefined}
        preload="none"
        controls={Boolean(activeSrc)}
        playsInline
        className="h-36 w-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {!activeSrc && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/80 text-[11px] text-slate-400">
          Click play to load preview
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}

      {!activeSrc && !isLoading && (
        <button
          type="button"
          onClick={handleTogglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20"
          aria-label="Play video preview"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/75 text-white">
            <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  )
}

export default VideoPreview
