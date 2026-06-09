const VideoPreview = ({ src, poster }) => {
  if (!src) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
        Add a demo video URL to preview playback
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-black">
      <video
        src={src}
        poster={poster || undefined}
        controls
        playsInline
        preload="metadata"
        className="h-36 w-full object-cover"
      />
    </div>
  )
}

export default VideoPreview
