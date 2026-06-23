import { useCallback, useEffect, useRef, useState } from 'react';
import { buildProductMediaItems } from '../../constants/mediaTypes';
import ProtectedMediaFrame from '../ui/ProtectedMediaFrame';
import OptimizedImage from '../ui/OptimizedImage';
import VideoThumbnail from '../ui/VideoThumbnail';
import FourCircleLoader from '../ui/FourCircleLoader';
import {
  exitDocumentFullscreen,
  exitVideoFullscreen,
  getFullscreenElement,
  isVideoNativeFullscreen,
  requestElementFullscreen,
  supportsElementFullscreen,
  prefersOverlayFullscreen,
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

const BUFFER_COMFORT_SECONDS = 0.5;
const LOADER_SHOW_DELAY_MS = 200;

const getBufferedAhead = (video) => {
  if (!video?.buffered?.length) return 0;

  const currentTime = video.currentTime;
  for (let index = 0; index < video.buffered.length; index += 1) {
    const start = video.buffered.start(index);
    const end = video.buffered.end(index);
    if (currentTime >= start - 0.05 && currentTime <= end + 0.05) {
      return Math.max(0, end - currentTime);
    }
  }

  return 0;
};

const hasComfortableBuffer = (video) => getBufferedAhead(video) >= BUFFER_COMFORT_SECONDS;

const isPlaybackStarved = (video) => {
  if (!video || video.paused || video.ended) return false;
  if (hasComfortableBuffer(video)) return false;
  return video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA;
};

const getBufferedEnd = (video) => {
  if (!video?.buffered?.length) return 0;
  try {
    return video.buffered.end(video.buffered.length - 1);
  } catch {
    return 0;
  }
};

const getDefaultMediaIndex = (items) => {
  const videoIndex = items.findIndex((item) => item.type === 'video');
  return videoIndex === -1 ? 0 : videoIndex;
};

const IMMERSIVE_RESUME_DELAYS_MS = [0, 50, 150, 300, 600];

const scheduleImmersiveResume = (callback) => {
  IMMERSIVE_RESUME_DELAYS_MS.forEach((delay) => {
    window.setTimeout(callback, delay);
  });
};

const ProductMediaGallery = ({ product }) => {
  const frameRef = useRef(null);
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const loadedVideoSrcRef = useRef('');
  const isFullscreenRef = useRef(false);
  const immersiveTransitionRef = useRef(false);
  const playbackSnapshotRef = useRef({ time: 0, wasPlaying: false });
  const userPausedRef = useRef(false);
  const immersiveUserGestureRef = useRef(false);
  const shouldBePlayingRef = useRef(false);
  const bufferingTimerRef = useRef(null);
  const mediaItems = buildProductMediaItems(product);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(() =>
    getDefaultMediaIndex(buildProductMediaItems(product)),
  );
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isNativeVideoFullscreen, setIsNativeVideoFullscreen] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoBufferedEnd, setVideoBufferedEnd] = useState(0);

  const selectedItem = mediaItems[selectedMediaIndex];
  const isVideoSelected = selectedItem?.type === 'video';
  const isImmersive = isLightboxOpen || isFullscreen || isNativeVideoFullscreen;
  const shouldBufferVideo = isVideoSelected;
  const controlButtonClass = `${videoControlButtonClass} ${isImmersive ? '!z-[120]' : ''}`;
  const playOverlayClass = isImmersive
    ? 'absolute inset-0 z-[110] flex items-center justify-center bg-black/25 transition-colors hover:bg-black/35 pointer-events-auto'
    : 'absolute inset-0 z-10 flex items-center justify-center bg-black/25 transition-colors hover:bg-black/35 pointer-events-auto';
  const bufferingOverlayClass = isImmersive
    ? 'absolute inset-0 z-[105] flex flex-col items-center justify-center pointer-events-none'
    : 'absolute inset-0 z-[15] flex flex-col items-center justify-center pointer-events-none';

  const clearBufferingTimer = useCallback(() => {
    if (bufferingTimerRef.current) {
      window.clearTimeout(bufferingTimerRef.current);
      bufferingTimerRef.current = null;
    }
  }, []);

  const clearVideoBuffering = useCallback(() => {
    clearBufferingTimer();
    setIsVideoBuffering(false);
  }, [clearBufferingTimer]);

  const syncVideoPlayingState = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setIsVideoPlaying(!video.paused && !video.ended);
  }, []);

  const tryResumeBufferedPlayback = useCallback(() => {
    const video = videoRef.current;
    if (
      !video ||
      userPausedRef.current ||
      immersiveTransitionRef.current ||
      !shouldBePlayingRef.current ||
      !video.paused ||
      video.ended ||
      !hasComfortableBuffer(video)
    ) {
      return;
    }

    video.muted = isMuted;
    void video.play().then(() => {
      setIsVideoPlaying(true);
      clearVideoBuffering();
    }).catch(() => {
      syncVideoPlayingState();
    });
  }, [isMuted, clearVideoBuffering, syncVideoPlayingState]);

  const syncBufferingFromVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || userPausedRef.current) {
      clearVideoBuffering();
      return;
    }

    if (!video.paused && hasComfortableBuffer(video)) {
      clearVideoBuffering();
      return;
    }

    if (!video.paused && !isPlaybackStarved(video)) {
      clearVideoBuffering();
    }
  }, [clearVideoBuffering]);

  const markVideoBuffering = useCallback(() => {
    if (userPausedRef.current) return;

    const video = videoRef.current;
    if (!video) return;

    if (!video.paused && hasComfortableBuffer(video)) {
      clearVideoBuffering();
      return;
    }

    if (!video.paused && !isPlaybackStarved(video)) {
      return;
    }

    clearBufferingTimer();
    bufferingTimerRef.current = window.setTimeout(() => {
      const currentVideo = videoRef.current;
      if (!currentVideo || userPausedRef.current) return;

      if (!currentVideo.paused && hasComfortableBuffer(currentVideo)) {
        clearVideoBuffering();
        return;
      }

      const starved =
        currentVideo.paused && shouldBePlayingRef.current
          ? !hasComfortableBuffer(currentVideo)
          : isPlaybackStarved(currentVideo);

      if (starved) {
        setIsVideoBuffering(true);
      }
    }, LOADER_SHOW_DELAY_MS);
  }, [clearBufferingTimer, clearVideoBuffering]);

  const capturePlaybackSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    playbackSnapshotRef.current = {
      time: video.currentTime || 0,
      wasPlaying: !video.paused && !video.ended,
    };
  }, []);

  const restorePlaybackAfterImmersive = useCallback(
    async ({ fromUserGesture = false } = {}) => {
      const video = videoRef.current;
      if (!video || !isVideoSelected || userPausedRef.current) return;

      const { time, wasPlaying } = playbackSnapshotRef.current;
      const shouldResume = wasPlaying || fromUserGesture;
      if (!shouldResume) return;

      immersiveTransitionRef.current = true;

      try {
        if (Number.isFinite(time) && time > 0) {
          const duration = Number.isFinite(video.duration) ? video.duration : 0;
          const safeTime = duration > 0 ? Math.min(time, Math.max(0, duration - 0.05)) : time;
          if (Math.abs(video.currentTime - safeTime) > 0.2) {
            video.currentTime = safeTime;
          }
        }

        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          await Promise.race([
            new Promise((resolve) => {
              if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                resolve();
                return;
              }
              video.addEventListener('canplay', resolve, { once: true });
            }),
            new Promise((resolve) => {
              window.setTimeout(resolve, 2000);
            }),
          ]);
        }

        video.muted = isMuted;
        await video.play();
        shouldBePlayingRef.current = true;
        setIsVideoPlaying(true);
        clearVideoBuffering();
      } catch {
        if (fromUserGesture) {
          try {
            video.muted = true;
            setIsMuted(true);
            await video.play();
            shouldBePlayingRef.current = true;
            setIsVideoPlaying(true);
            clearVideoBuffering();
          } catch {
            syncVideoPlayingState();
            clearVideoBuffering();
          }
        } else {
          syncVideoPlayingState();
          clearVideoBuffering();
        }
      } finally {
        window.setTimeout(() => {
          immersiveTransitionRef.current = false;
          syncVideoPlayingState();
        }, 400);
      }
    },
    [isVideoSelected, isMuted, clearVideoBuffering, syncVideoPlayingState],
  );

  const finishImmersiveTransition = useCallback(
    ({ fromUserGesture = false } = {}) => {
      const canUseGesture = fromUserGesture || immersiveUserGestureRef.current;
      if (canUseGesture) {
        immersiveUserGestureRef.current = false;
      }

      scheduleImmersiveResume(() => {
        restorePlaybackAfterImmersive({ fromUserGesture: canUseGesture });
      });
    },
    [restorePlaybackAfterImmersive],
  );

  const beginImmersiveTransition = useCallback(
    ({ fromUserGesture = false } = {}) => {
      capturePlaybackSnapshot();
      immersiveTransitionRef.current = true;
      if (fromUserGesture) {
        immersiveUserGestureRef.current = true;
      }
    },
    [capturePlaybackSnapshot],
  );

  useEffect(() => {
    if (!isVideoSelected || !selectedItem?.src) return undefined;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = selectedItem.src;
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [isVideoSelected, selectedItem?.src, product?.id]);

  useEffect(() => {
    loadedVideoSrcRef.current = '';
    setSelectedMediaIndex(getDefaultMediaIndex(mediaItems));
    setIsVideoPlaying(false);
    setIsVideoBuffering(false);
    setIsUserPaused(false);
    userPausedRef.current = false;
    shouldBePlayingRef.current = false;
    clearVideoBuffering();
    setIsMuted(true);
    setIsLightboxOpen(false);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setVideoBufferedEnd(0);
  }, [product?.id]);

  useEffect(() => {
    const video = videoRef.current;
    const nextSrc = selectedItem?.src || '';
    if (!video || !isVideoSelected || !nextSrc) return;

    if (loadedVideoSrcRef.current === nextSrc) return;

    loadedVideoSrcRef.current = nextSrc;
    video.load();
    setIsVideoPlaying(false);
    setIsVideoBuffering(true);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setVideoBufferedEnd(0);
  }, [product?.id, selectedItem?.src, isVideoSelected]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSelected) return undefined;

    const syncProgress = () => {
      setVideoCurrentTime(video.currentTime || 0);
      setVideoDuration(Number.isFinite(video.duration) ? video.duration : 0);
      setVideoBufferedEnd(getBufferedEnd(video));
      syncBufferingFromVideo();
      tryResumeBufferedPlayback();
    };

    syncProgress();
    video.addEventListener('timeupdate', syncProgress);
    video.addEventListener('progress', syncProgress);
    video.addEventListener('loadedmetadata', syncProgress);
    video.addEventListener('durationchange', syncProgress);
    video.addEventListener('seeked', syncProgress);

    return () => {
      video.removeEventListener('timeupdate', syncProgress);
      video.removeEventListener('progress', syncProgress);
      video.removeEventListener('loadedmetadata', syncProgress);
      video.removeEventListener('durationchange', syncProgress);
      video.removeEventListener('seeked', syncProgress);
    };
  }, [isVideoSelected, selectedItem?.src, product?.id, syncBufferingFromVideo, tryResumeBufferedPlayback]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSelected) return undefined;

    const onWaiting = () => markVideoBuffering();
    const onStalled = () => {
      if (isPlaybackStarved(video)) {
        markVideoBuffering();
      }
    };
    const onSeeking = () => {
      if (!video.paused && !hasComfortableBuffer(video)) {
        markVideoBuffering();
      }
    };
    const onCanPlay = () => {
      syncBufferingFromVideo();
      tryResumeBufferedPlayback();
    };
    const onCanPlayThrough = () => clearVideoBuffering();
    const onPlaying = () => {
      shouldBePlayingRef.current = true;
      clearVideoBuffering();
    };
    const onPause = () => {
      if (!immersiveTransitionRef.current) clearVideoBuffering();
    };
    const onEnded = () => clearVideoBuffering();
    const onError = () => clearVideoBuffering();

    video.addEventListener('waiting', onWaiting);
    video.addEventListener('stalled', onStalled);
    video.addEventListener('seeking', onSeeking);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('canplaythrough', onCanPlayThrough);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('stalled', onStalled);
      video.removeEventListener('seeking', onSeeking);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('canplaythrough', onCanPlayThrough);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
    };
  }, [
    isVideoSelected,
    selectedItem?.src,
    product?.id,
    markVideoBuffering,
    clearVideoBuffering,
    syncBufferingFromVideo,
    tryResumeBufferedPlayback,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSelected || userPausedRef.current) return undefined;

    let cancelled = false;

    const startPlayback = async () => {
      if (cancelled || userPausedRef.current) return;

      if (!video.paused) {
        shouldBePlayingRef.current = true;
        setIsVideoPlaying(true);
        clearVideoBuffering();
        return;
      }

      shouldBePlayingRef.current = true;

      if (!hasComfortableBuffer(video) && video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
        markVideoBuffering();
      }

      try {
        video.muted = isMuted;
        await video.play();
        if (!cancelled) {
          setIsVideoPlaying(true);
          clearVideoBuffering();
        }
      } catch {
        if (!cancelled) {
          shouldBePlayingRef.current = false;
          setIsVideoPlaying(false);
          clearVideoBuffering();
        }
      }
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      startPlayback();
    } else {
      markVideoBuffering();
      video.addEventListener('canplay', startPlayback, { once: true });
    }

    return () => {
      cancelled = true;
      video.removeEventListener('canplay', startPlayback);
    };
  }, [isVideoSelected, selectedItem?.src, product?.id, isMuted, isUserPaused, markVideoBuffering, clearVideoBuffering]);

  useEffect(() => {
    const syncFullscreen = () => {
      const wasFullscreen = isFullscreenRef.current;
      const nowFullscreen = getFullscreenElement() === frameRef.current;
      isFullscreenRef.current = nowFullscreen;
      setIsFullscreen(nowFullscreen);

      if (nowFullscreen !== wasFullscreen) {
        finishImmersiveTransition();
      }
    };

    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
    };
  }, [finishImmersiveTransition]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (!isLightboxOpen || !isVideoSelected) return undefined;

    finishImmersiveTransition();

    return undefined;
  }, [isLightboxOpen, isVideoSelected, finishImmersiveTransition]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSelected) return undefined;

    const syncNativeFullscreen = () => {
      const nowNative = isVideoNativeFullscreen(video);
      setIsNativeVideoFullscreen(nowNative);
      if (nowNative) {
        finishImmersiveTransition();
      }
    };

    video.addEventListener('webkitbeginfullscreen', syncNativeFullscreen);
    video.addEventListener('webkitendfullscreen', syncNativeFullscreen);

    return () => {
      video.removeEventListener('webkitbeginfullscreen', syncNativeFullscreen);
      video.removeEventListener('webkitendfullscreen', syncNativeFullscreen);
    };
  }, [isVideoSelected, selectedItem?.src, finishImmersiveTransition]);

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
    userPausedRef.current = false;
    shouldBePlayingRef.current = false;
    setIsUserPaused(false);
    clearVideoBuffering();
    setSelectedMediaIndex(index);
    setIsVideoPlaying(false);
  };

  const handlePrevMedia = () => {
    selectMedia(selectedMediaIndex === 0 ? mediaItems.length - 1 : selectedMediaIndex - 1);
  };

  const handleNextMedia = () => {
    selectMedia(selectedMediaIndex === mediaItems.length - 1 ? 0 : selectedMediaIndex + 1);
  };

  const playVideo = async ({ fromUserGesture = false } = {}) => {
    const video = videoRef.current;
    if (!video) return;

    userPausedRef.current = false;
    setIsUserPaused(false);
    shouldBePlayingRef.current = true;

    if (!hasComfortableBuffer(video) && video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) {
      markVideoBuffering();
    }

    if (video.ended) {
      video.currentTime = 0;
    }

    try {
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        await Promise.race([
          new Promise((resolve) => {
            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
              resolve();
              return;
            }
            video.addEventListener('canplay', resolve, { once: true });
          }),
          new Promise((resolve) => {
            window.setTimeout(resolve, 2000);
          }),
        ]);
      }

      video.muted = isMuted;
      await video.play();
      shouldBePlayingRef.current = true;
      setIsVideoPlaying(true);
      clearVideoBuffering();
    } catch {
      if (fromUserGesture) {
        try {
          video.muted = true;
          setIsMuted(true);
          await video.play();
          shouldBePlayingRef.current = true;
          setIsVideoPlaying(true);
          clearVideoBuffering();
        } catch {
          shouldBePlayingRef.current = false;
          setIsVideoPlaying(false);
          clearVideoBuffering();
        }
      } else {
        shouldBePlayingRef.current = false;
        setIsVideoPlaying(false);
        clearVideoBuffering();
      }
    }
  };

  const toggleVideoPlay = async (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    const video = videoRef.current;
    if (!video) return;

    if (!video.paused) {
      userPausedRef.current = true;
      shouldBePlayingRef.current = false;
      setIsUserPaused(true);
      clearVideoBuffering();
      video.pause();
      return;
    }

    await playVideo({ fromUserGesture: true });
  };

  const toggleVideoMute = () => {
    const video = videoRef.current;
    const nextMuted = !isMuted;
    if (video) {
      video.muted = nextMuted;
    }
    setIsMuted(nextMuted);
  };

  const handleSeek = (event) => {
    const video = videoRef.current;
    const bar = progressBarRef.current;
    if (!video || !bar || !videoDuration) return;

    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    video.currentTime = ratio * videoDuration;
    setVideoCurrentTime(video.currentTime);
    setVideoBufferedEnd(getBufferedEnd(video));
  };

  const playedPercent = videoDuration ? Math.min(100, (videoCurrentTime / videoDuration) * 100) : 0;
  const bufferedPercent = videoDuration ? Math.min(100, (videoBufferedEnd / videoDuration) * 100) : 0;

  const renderVideoProgressBar = (variant = 'inline') => {
    const isOverlay = variant === 'overlay';

    if (isOverlay) {
      return (
        <div className="min-w-[140px] flex-1">
          <div
            ref={progressBarRef}
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={videoDuration || 0}
            aria-valuenow={videoCurrentTime}
            tabIndex={0}
            onClick={handleSeek}
            onKeyDown={(event) => {
              const video = videoRef.current;
              if (!video || !videoDuration) return;
              if (event.key === 'ArrowRight') {
                video.currentTime = Math.min(videoDuration, video.currentTime + 5);
              }
              if (event.key === 'ArrowLeft') {
                video.currentTime = Math.max(0, video.currentTime - 5);
              }
            }}
            className="relative h-1 w-full cursor-pointer rounded-full bg-white/25"
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/45"
              style={{ width: `${bufferedPercent}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white"
              style={{ width: `${playedPercent}%` }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2 w-full min-w-0 max-w-full">
        <div
          ref={progressBarRef}
          role="slider"
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={videoDuration || 0}
          aria-valuenow={videoCurrentTime}
          tabIndex={0}
          onClick={handleSeek}
          onKeyDown={(event) => {
            const video = videoRef.current;
            if (!video || !videoDuration) return;
            if (event.key === 'ArrowRight') {
              video.currentTime = Math.min(videoDuration, video.currentTime + 5);
            }
            if (event.key === 'ArrowLeft') {
              video.currentTime = Math.max(0, video.currentTime - 5);
            }
          }}
          className="relative h-1 w-full cursor-pointer rounded-full bg-gray-200"
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gray-300"
            style={{ width: `${bufferedPercent}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gray-900"
            style={{ width: `${playedPercent}%` }}
          />
        </div>
      </div>
    );
  };

  const openLightbox = ({ fromUserGesture = false } = {}) => {
    beginImmersiveTransition({ fromUserGesture });
    setIsLightboxOpen(true);
    if (fromUserGesture) {
      void restorePlaybackAfterImmersive({ fromUserGesture: true });
    }
  };

  const toggleFullscreen = async (event) => {
    event?.stopPropagation?.();

    const frame = frameRef.current;
    const video = videoRef.current;
    const inDocumentFullscreen = Boolean(frame && getFullscreenElement() === frame);
    const inNativeVideoFullscreen = Boolean(video && isVideoNativeFullscreen(video));

    if (inDocumentFullscreen) {
      try {
        await exitDocumentFullscreen();
      } catch {
        // ignore
      }
      isFullscreenRef.current = false;
      setIsFullscreen(false);
      return;
    }

    if (isLightboxOpen) {
      closeLightbox();
      return;
    }

    if (inNativeVideoFullscreen) {
      exitVideoFullscreen(video);
      setIsNativeVideoFullscreen(false);
      return;
    }

    if (isFullscreen || isNativeVideoFullscreen) {
      isFullscreenRef.current = false;
      setIsFullscreen(false);
      setIsNativeVideoFullscreen(false);
    }

    beginImmersiveTransition({ fromUserGesture: true });

    if (prefersOverlayFullscreen()) {
      setIsLightboxOpen(true);
      void restorePlaybackAfterImmersive({ fromUserGesture: true });
      return;
    }

    if (frame && supportsElementFullscreen()) {
      try {
        await requestElementFullscreen(frame);
        isFullscreenRef.current = true;
        setIsFullscreen(true);
        void restorePlaybackAfterImmersive({ fromUserGesture: true });
        finishImmersiveTransition({ fromUserGesture: true });
        return;
      } catch {
        immersiveTransitionRef.current = false;
        immersiveUserGestureRef.current = false;
      }
    }

    openLightbox({ fromUserGesture: true });
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
            src={selectedItem.src}
            poster={selectedItem.poster}
            className={`max-h-full max-w-full object-contain ${PROTECTED_MEDIA_CLASS}`}
            playsInline
            muted={isMuted}
            preload={shouldBufferVideo ? 'auto' : 'none'}
            onPlay={() => setIsVideoPlaying(true)}
            onPause={() => {
              if (immersiveTransitionRef.current) {
                window.setTimeout(() => {
                  if (!immersiveTransitionRef.current) {
                    syncVideoPlayingState();
                    if (videoRef.current?.paused) {
                      clearVideoBuffering();
                    }
                  }
                }, 450);
                return;
              }
              setIsVideoPlaying(false);
              clearVideoBuffering();
            }}
            onEnded={() => {
              if (immersiveTransitionRef.current) return;
              userPausedRef.current = true;
              shouldBePlayingRef.current = false;
              setIsUserPaused(true);
              setIsVideoPlaying(false);
              clearVideoBuffering();
            }}
            onError={() => {
              setIsVideoPlaying(false);
              clearVideoBuffering();
            }}
            {...getProtectedVideoProps()}
          />

          {isVideoBuffering && !(videoRef.current && hasComfortableBuffer(videoRef.current)) && (
            <div className={bufferingOverlayClass} aria-live="polite" aria-busy="true" aria-label="Loading video">
              <FourCircleLoader />
            </div>
          )}

          {!isVideoPlaying && !isVideoBuffering && (
            <button
              type="button"
              onClick={toggleVideoPlay}
              className={playOverlayClass}
              aria-label="Play demo video"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-xl sm:h-16 sm:w-16">
                <svg className="ml-1 h-6 w-6 text-gray-900 sm:h-7 sm:w-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          )}

          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVideoPlay}
              className={controlButtonClass}
              aria-label={isVideoPlaying ? 'Pause demo video' : 'Play demo video'}
              title={isVideoPlaying ? 'Pause' : 'Play'}
            >
              {isVideoPlaying ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={toggleVideoMute}
              className={controlButtonClass}
              aria-label={isMuted ? 'Unmute demo video' : 'Mute demo video'}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <IconVolumeOff className="h-4 w-4" /> : <IconVolumeOn className="h-4 w-4" />}
            </button>
            {isLightboxOpen ? renderVideoProgressBar('overlay') : null}
          </div>
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
    <div className="pointer-events-none absolute inset-0 z-30">
      <div
        className={`pointer-events-auto absolute rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white ${
          compact ? 'left-3 top-3' : 'left-4 top-4'
        } ${isVideoSelected ? '' : 'uppercase'}`}
      >
        {isVideoSelected ? '40 sec Preview' : 'Preview'}
      </div>

      <button
        type="button"
        onClick={toggleFullscreen}
        className={`pointer-events-auto absolute ${compact ? 'right-3 top-3' : 'right-4 top-4'} ${fullscreenButtonClass} ${isImmersive ? '!z-[120]' : 'z-30'}`}
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
        <div className={`pointer-events-auto absolute flex gap-1.5 ${compact ? 'bottom-3 right-3' : 'bottom-4 right-4'}`}>
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
    </div>
  );

  const inlineFrameClassName =
    'aspect-[10/9] w-full min-h-[260px] overflow-hidden rounded-xl border border-gray-200 bg-black shadow-lg sm:min-h-[340px] sm:rounded-2xl lg:min-h-[420px] lg:aspect-[4/3]';

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      {isLightboxOpen ? (
        <div className={`${inlineFrameClassName} pointer-events-none invisible`} aria-hidden />
      ) : null}

      <div
        className={isLightboxOpen ? 'media-lightbox' : 'relative w-full'}
        role={isLightboxOpen ? 'dialog' : undefined}
        aria-modal={isLightboxOpen ? 'true' : undefined}
        aria-label={isLightboxOpen ? 'Fullscreen media preview' : undefined}
      >
        <ProtectedMediaFrame
          ref={frameRef}
          watermark
          className={isLightboxOpen ? 'media-lightbox__frame' : inlineFrameClassName}
        >
          {renderMediaChrome(!isLightboxOpen)}
          <div className={isLightboxOpen ? 'media-lightbox__media' : 'relative h-full w-full'}>
            {mediaContent}
          </div>
        </ProtectedMediaFrame>
      </div>

      {isVideoSelected && !isLightboxOpen && renderVideoProgressBar('inline')}

      {mediaItems.length > 1 && (
        <div className={`flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:gap-2.5 ${isVideoSelected ? 'mt-2' : 'mt-3'}`}>
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
