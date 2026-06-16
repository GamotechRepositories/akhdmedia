import { useEffect, useRef } from 'react';
import {
  PROTECTED_MEDIA_CLASS,
  getProtectedVideoProps,
} from '../../utils/mediaProtection';

const seekToPreviewFrame = (video) => {
  if (!video || video.readyState < 2) return;

  try {
    const targetTime = video.duration && Number.isFinite(video.duration)
      ? Math.min(0.1, Math.max(0, video.duration - 0.05))
      : 0.1;
    video.currentTime = targetTime;
  } catch {
    // Ignore seek errors for unsupported streams.
  }
};

const VideoThumbnail = ({ src, alt = '', className = '' }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return undefined;

    const handleLoadedData = () => seekToPreviewFrame(video);

    video.addEventListener('loadeddata', handleLoadedData);
    if (video.readyState >= 2) {
      seekToPreviewFrame(video);
    }

    return () => video.removeEventListener('loadeddata', handleLoadedData);
  }, [src]);

  if (!src) return null;

  return (
    <video
      ref={videoRef}
      src={src}
      muted
      playsInline
      preload="metadata"
      aria-label={alt}
      className={`pointer-events-none ${PROTECTED_MEDIA_CLASS} ${className}`.trim()}
      {...getProtectedVideoProps()}
    />
  );
};

export default VideoThumbnail;
