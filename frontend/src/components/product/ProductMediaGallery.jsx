import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { buildProductMediaItems } from '../../constants/mediaTypes';
import ProtectedMediaFrame from '../ui/ProtectedMediaFrame';
import OptimizedImage from '../ui/OptimizedImage';
import VideoThumbnail from '../ui/VideoThumbnail';
import { useInView } from '../../hooks/useInView';
import {
  exitDocumentFullscreen,
  exitVideoFullscreen,
  getFullscreenElement,
  isIOSDevice,
  isVideoNativeFullscreen,
  requestElementFullscreen,
  supportsElementFullscreen,
} from '../../utils/fullscreen';
import {
  IconMaximize,
  IconMinimize,
  IconVolumeOff,
  IconVolumeOn,
} from '../icons/Icons';
import {
  PROTECTED_MEDIA_CLASS,
  getProtectedVideoProps,
} from '../../utils/mediaProtection';

const fullscreenButtonClass =
  'group/fullscreen flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-black/85 text-white shadow-lg transition hover:scale-105 hover:border-white/40 hover:bg-black/95 active:scale-95 sm:h-10 sm:w-10';
const videoControlButtonClass =
  'z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-white/25 bg-black/85 text-white shadow-lg transition hover:scale-105 hover:border-white/40 hover:bg-black/95 active:scale-95';
const SCROLL_RESUME_MS = 250;

const getDefaultMediaIndex = (items) => {
  const videoIndex = items.findIndex((item) => item.type === 'video');
  return videoIndex === -1 ? 0 : videoIndex;
};

const ProductMediaGallery = ({ product }) => {
  const frameRef = useRef(null);
  const videoRef = useRef(null);
  const { ref: galleryRef, isInView } = useInView('120px 0px 120px 0px');
  const mediaItems = buildProductMediaItems(product);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(() =>
    getDefaultMediaIndex(buildProductMediaItems(product)),
  );
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isNativeVideoFullscreen, setIsNativeVideoFullscreen] = useState(false);

  const selectedItem = mediaItems[selectedMediaIndex];
  const isVideoSelected = selectedItem?.type === 'video';
  const isImmersive = isLightboxOpen || isFullscreen || isNativeVideoFullscreen;

  useEffect(() => {
    setSelectedMediaIndex(getDefaultMediaIndex(mediaItems));
    setIsVideoPlaying(false);
    setIsMuted(true);
    setIsLightboxOpen(false);
  }, [product?.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSelected) return;

    video.load();
    setIsVideoPlaying(false);

    const startPlayback = async () => {
      try {
        video.muted = isMuted;
        await video.play();
        setIsVideoPlaying(true);
      } catch {
        setIsVideoPlaying(false);
      }
    };

    if (isLightboxOpen) {
      startPlayback();
      return;
    }

    if (!isInView) {
      video.pause();
      return;
    }

    startPlayback();
  }, [selectedMediaIndex, isVideoSelected, product?.id, isLightboxOpen, isMuted, isInView]);

  useEffect(() => {
    if (!isVideoSelected || !isInView || isLightboxOpen) return undefined;

    const video = videoRef.current;
    let resumeTimer;

    const handleScroll = () => {
      if (!video) return;

      if (!video.paused) {
        video.pause();
        setIsVideoPlaying(false);
      }

      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        if (!isInView || isLightboxOpen) return;

        video.play()
          .then(() => setIsVideoPlaying(true))
          .catch(() => setIsVideoPlaying(false));
      }, SCROLL_RESUME_MS);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.clearTimeout(resumeTimer);
    };
  }, [isVideoSelected, isInView, isLightboxOpen, selectedItem?.src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(getFullscreenElement() === frameRef.current);
    };

    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSelected) return undefined;

    const syncNativeFullscreen = () => {
      setIsNativeVideoFullscreen(isVideoNativeFullscreen(video));
    };

    video.addEventListener('webkitbeginfullscreen', syncNativeFullscreen);
    video.addEventListener('webkitendfullscreen', syncNativeFullscreen);

    return () => {
      video.removeEventListener('webkitbeginfullscreen', syncNativeFullscreen);
      video.removeEventListener('webkitendfullscreen', syncNativeFullscreen);
    };
  }, [isVideoSelected, selectedItem?.src]);

  useEffect(() => {
    if (!isLightboxOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };

    const scrollY = window.scrollY;
    const lockBodyScroll = () => {
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    };

    const updateViewportHeight = () => {
      const height = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--media-lightbox-height', `${height}px`);
    };

    lockBodyScroll();
    updateViewportHeight();
    window.addEventListener('keydown', onKeyDown);
    window.visualViewport?.addEventListener('resize', updateViewportHeight);
    window.visualViewport?.addEventListener('scroll', updateViewportHeight);

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.removeProperty('--media-lightbox-height');
      window.removeEventListener('keydown', onKeyDown);
      window.visualViewport?.removeEventListener('resize', updateViewportHeight);
      window.visualViewport?.removeEventListener('scroll', updateViewportHeight);
      window.scrollTo(0, scrollY);
    };
  }, [isLightboxOpen]);

  const selectMedia = (index) => {
    setIsLightboxOpen(false);
    videoRef.current?.pause();
    setSelectedMediaIndex(index);
    setIsVideoPlaying(false);
  };

  const handlePrevMedia = () => {
    selectMedia(selectedMediaIndex === 0 ? mediaItems.length - 1 : selectedMediaIndex - 1);
  };

  const handleNextMedia = () => {
    selectMedia(selectedMediaIndex === mediaItems.length - 1 ? 0 : selectedMediaIndex + 1);
  };

  const toggleVideoPlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (!video.paused) {
      video.pause();
      return;
    }

    try {
      await video.play();
    } catch {
      try {
        video.muted = true;
        await video.play();
      } catch {
        setIsVideoPlaying(false);
      }
    }
  };

  const toggleVideoMute = () => {
    const video = videoRef.current;
    const nextMuted = !isMuted;
    if (video) {
      video.muted = nextMuted;
    }
    setIsMuted(nextMuted);
  };

  const openLightbox = () => {
    setIsLightboxOpen(true);
  };

  const toggleFullscreen = async () => {
    const frame = frameRef.current;
    const video = videoRef.current;

    if (isImmersive) {
      if (isLightboxOpen) {
        closeLightbox();
        return;
      }

      if (getFullscreenElement()) {
        try {
          await exitDocumentFullscreen();
        } catch {
          // ignore
        }
        return;
      }

      exitVideoFullscreen(video);
      return;
    }

    if (isIOSDevice()) {
      openLightbox();
      return;
    }

    if (frame && supportsElementFullscreen()) {
      try {
        await requestElementFullscreen(frame);
        return;
      } catch {
        // fall through to lightbox
      }
    }

    openLightbox();
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  if (!mediaItems.length) return null;

  const mediaContent = (
    <>
      {isVideoSelected ? (
        <div className="relative flex h-full w-full items-center justify-center">
          <video
            ref={videoRef}
            key={selectedItem.src}
            src={selectedItem.src}
            poster={selectedItem.poster}
            className={`max-h-full max-w-full object-contain ${PROTECTED_MEDIA_CLASS}`}
            loop
            muted={isMuted}
            preload={isInView ? 'metadata' : 'none'}
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => setIsVideoPlaying(false)}
            onEnded={() => setIsVideoPlaying(false)}
            onError={() => setIsVideoPlaying(false)}
            {...getProtectedVideoProps()}
          />

          {!isVideoPlaying && (
            <button
              type="button"
              onClick={toggleVideoPlay}
              className="absolute inset-0 z-10 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/35"
              aria-label="Play demo video"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-xl sm:h-16 sm:w-16">
                <svg className="ml-1 h-6 w-6 text-gray-900 sm:h-7 sm:w-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          )}

          {isVideoPlaying && (
            <div className="absolute bottom-3 left-3 z-20 flex gap-2">
              <button
                type="button"
                onClick={toggleVideoPlay}
                className={videoControlButtonClass}
                aria-label="Pause demo video"
                title="Pause"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={toggleVideoMute}
                className={videoControlButtonClass}
                aria-label={isMuted ? 'Unmute demo video' : 'Mute demo video'}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <IconVolumeOff className="h-4 w-4" /> : <IconVolumeOn className="h-4 w-4" />}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <OptimizedImage
            src={selectedItem.src}
            alt={product.name}
            width={1200}
            height={1200}
            quality={80}
            className={`max-h-full max-w-full object-contain ${PROTECTED_MEDIA_CLASS}`}
            loading="eager"
          />
        </div>
      )}
    </>
  );

  const renderMediaChrome = (compact = false) => (
    <>
      <div
        className={`absolute z-10 rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white ${
          compact ? 'left-3 top-3' : 'left-4 top-4'
        }`}
      >
        {isVideoSelected ? 'Demo preview' : 'Preview'}
      </div>

      <button
        type="button"
        onClick={toggleFullscreen}
        className={`absolute z-20 ${compact ? 'right-3 top-3' : 'right-4 top-4'} ${fullscreenButtonClass}`}
        aria-label={isImmersive ? 'Exit fullscreen' : 'View fullscreen'}
        title={isImmersive ? 'Exit fullscreen' : 'Fullscreen'}
      >
        {isImmersive ? (
          <IconMinimize className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
        ) : (
          <IconMaximize className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
        )}
      </button>

      {mediaItems.length > 1 && (
        <div className={`absolute z-20 flex gap-1.5 ${compact ? 'bottom-3 right-3' : 'bottom-4 right-4'}`}>
          <button
            type="button"
            onClick={handlePrevMedia}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white transition hover:bg-black/90"
            aria-label="Previous"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNextMedia}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white transition hover:bg-black/90"
            aria-label="Next"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </>
  );

  const lightbox = isLightboxOpen
    ? createPortal(
        <div className="media-lightbox" role="dialog" aria-modal="true" aria-label="Fullscreen media preview">
          <ProtectedMediaFrame watermark className="media-lightbox__frame">
            {renderMediaChrome(false)}
            <div className="media-lightbox__media">{mediaContent}</div>
          </ProtectedMediaFrame>
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={galleryRef} className="transform-gpu [contain:layout_paint]">
      <ProtectedMediaFrame
        ref={frameRef}
        watermark
        className="aspect-[10/9] w-full min-h-[260px] overflow-hidden rounded-xl border border-gray-200 bg-black shadow-lg sm:min-h-[340px] sm:rounded-2xl lg:min-h-[420px] lg:aspect-[4/3]"
      >
        {renderMediaChrome(true)}
        {!isLightboxOpen ? mediaContent : null}
      </ProtectedMediaFrame>

      {lightbox}

      {mediaItems.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:gap-2.5">
          {mediaItems.map((item, index) => (
            <button
              key={`${item.type}-${index}`}
              type="button"
              onClick={() => selectMedia(index)}
              className={`relative aspect-video w-20 shrink-0 overflow-hidden rounded-md border-2 transition-all sm:w-24 ${
                selectedMediaIndex === index
                  ? 'border-gray-900 ring-1 ring-gray-900'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              {item.type === 'video' ? (
                <>
                  {item.poster ? (
                    <OptimizedImage
                      src={item.poster}
                      alt="Video preview"
                      width={192}
                      height={108}
                      quality={70}
                      loading="lazy"
                      className={`h-full w-full object-cover ${PROTECTED_MEDIA_CLASS}`}
                    />
                  ) : (
                    <VideoThumbnail
                      src={item.src}
                      alt="Video preview"
                      className="h-full w-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </>
              ) : (
                <OptimizedImage
                  src={item.src}
                  alt={item.label}
                  width={192}
                  height={108}
                  quality={70}
                  loading="lazy"
                  className={`h-full w-full object-cover ${PROTECTED_MEDIA_CLASS}`}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductMediaGallery;
