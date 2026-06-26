import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { buildProductMediaItems } from '../../constants/mediaTypes';
import ProtectedMediaFrame from '../ui/ProtectedMediaFrame';
import OptimizedImage from '../ui/OptimizedImage';
import VideoThumbnail from '../ui/VideoThumbnail';
import FourCircleLoader from '../ui/FourCircleLoader';
import {
  exitDocumentFullscreen,
  exitVideoFullscreen,
  getFullscreenElement,
  isIOSDevice,
  isVideoNativeFullscreen,
  prefersOverlayFullscreen,
  requestElementFullscreen,
  requestVideoFullscreen,
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

const ProductMediaGallery = ({ product }) => {
  const frameRef = useRef(null);
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const loadedVideoSrcRef = useRef('');
  const isFullscreenRef = useRef(false);
  const playbackSnapshotRef = useRef({ time: 0, wasPlaying: false });

  // --- Playback control refs (not state, to avoid stale closures) ---
  const userPausedRef = useRef(false);      // true when user explicitly paused
  const inTransitionRef = useRef(false);    // true during fullscreen enter/exit
  const pendingPlayRef = useRef(null);      // AbortController for in-flight play()
  const pendingLightboxResumeRef = useRef(null);

  const mediaItems = buildProductMediaItems(product);

  const [selectedMediaIndex, setSelectedMediaIndex] = useState(() =>
    getDefaultMediaIndex(buildProductMediaItems(product)),
  );
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState(false);
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

  // ─── Core play engine ────────────────────────────────────────────────────

  /**
   * Cancel any in-flight play() promise to avoid AbortError cascade.
   */
  const cancelPendingPlay = useCallback(() => {
    if (pendingPlayRef.current) {
      pendingPlayRef.current.cancelled = true;
      pendingPlayRef.current = null;
    }
  }, []);

  /**
   * Play the video. Safe to call multiple times — cancels previous attempt.
   * @param {object} opts
   * @param {boolean} opts.fromUserGesture - true when triggered directly by user click
   * @param {number|null} opts.seekTo - seek to this time before playing
   */
  const safePlay = useCallback(
    async ({ fromUserGesture = false, seekTo = null } = {}) => {
      const video = videoRef.current;
      if (!video) return;

      // Cancel any previous in-flight play
      cancelPendingPlay();

      const token = { cancelled: false };
      pendingPlayRef.current = token;

      setIsVideoBuffering(true);

      // Seek if requested
      if (seekTo !== null && Number.isFinite(seekTo) && seekTo >= 0) {
        const dur = Number.isFinite(video.duration) ? video.duration : 0;
        const safe = dur > 0 ? Math.min(seekTo, Math.max(0, dur - 0.05)) : seekTo;
        if (Math.abs(video.currentTime - safe) > 0.2) {
          video.currentTime = safe;
        }
      }

      // Wait for enough data
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        await new Promise((resolve) => {
          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            resolve();
            return;
          }
          const onReady = () => resolve();
          video.addEventListener('canplay', onReady, { once: true });
          window.setTimeout(resolve, 3000); // fallback timeout
        });
      }

      if (token.cancelled) return;

      try {
        video.muted = isMuted;
        await video.play();
        if (!token.cancelled) {
          setIsVideoPlaying(true);
          setIsVideoBuffering(false);
          pendingPlayRef.current = null;
        }
      } catch (err) {
        if (token.cancelled) return;
        // Autoplay blocked — try muted fallback on user gesture
        if (fromUserGesture && !video.muted) {
          try {
            video.muted = true;
            setIsMuted(true);
            await video.play();
            if (!token.cancelled) {
              setIsVideoPlaying(true);
              setIsVideoBuffering(false);
              pendingPlayRef.current = null;
            }
            return;
          } catch {
            // give up
          }
        }
        if (!token.cancelled) {
          setIsVideoPlaying(false);
          setIsVideoBuffering(false);
          pendingPlayRef.current = null;
        }
      }
    },
    [isMuted, cancelPendingPlay],
  );

  /**
   * Pause the video explicitly (user action).
   */
  const safePause = useCallback(() => {
    cancelPendingPlay();
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setIsVideoPlaying(false);
    setIsVideoBuffering(false);
  }, [cancelPendingPlay]);

  // ─── Fullscreen / Immersive helpers ─────────────────────────────────────

  /**
   * Save time + playing state before entering/exiting fullscreen.
   * Returns the snapshot so callers can use it.
   */
  const captureSnapshot = useCallback(() => {
    const video = videoRef.current;
    const snapshot = {
      time: video?.currentTime ?? 0,
      wasPlaying: video ? !video.paused && !video.ended : false,
    };
    playbackSnapshotRef.current = snapshot;
    return snapshot;
  }, []);

  /**
   * Resume playback after fullscreen enter/exit. Retries until playing or attempts exhausted.
   */
  const resumePlayback = useCallback(
    async (snapshot, { fromUserGesture = false } = {}) => {
      if (userPausedRef.current) return;

      const { time, wasPlaying } = snapshot ?? playbackSnapshotRef.current;
      const shouldResume = wasPlaying || fromUserGesture;
      if (!shouldResume) return;

      const delays = [0, 120, 300, 600, 1000];

      for (const delay of delays) {
        if (delay > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, delay));
        }
        if (userPausedRef.current) return;

        const video = videoRef.current;
        if (!video) return;

        if (!video.paused && !video.ended) {
          setIsVideoPlaying(true);
          setIsVideoBuffering(false);
          return;
        }

        if (Number.isFinite(time) && time > 0) {
          const duration = Number.isFinite(video.duration) ? video.duration : 0;
          const safeTime = duration > 0 ? Math.min(time, Math.max(0, duration - 0.05)) : time;
          if (Math.abs(video.currentTime - safeTime) > 0.25) {
            video.currentTime = safeTime;
          }
        }

        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          await new Promise((resolve) => {
            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
              resolve();
              return;
            }
            video.addEventListener('canplay', resolve, { once: true });
            window.setTimeout(resolve, 2000);
          });
        }

        try {
          video.muted = isMuted;
          await video.play();
          setIsVideoPlaying(true);
          setIsVideoBuffering(false);
          return;
        } catch {
          if (fromUserGesture && !video.muted) {
            try {
              video.muted = true;
              setIsMuted(true);
              await video.play();
              setIsVideoPlaying(true);
              setIsVideoBuffering(false);
              return;
            } catch {
              // try next delay
            }
          }
        }
      }

      const video = videoRef.current;
      if (video) {
        setIsVideoPlaying(!video.paused && !video.ended);
        setIsVideoBuffering(false);
      }
    },
    [isMuted],
  );

  // ─── Fullscreen enter/exit ───────────────────────────────────────────────

  const enterFullscreen = useCallback(
    async ({ fromUserGesture = true } = {}) => {
      const frame = frameRef.current;
      const video = videoRef.current;
      if (!frame) return;

      const snapshot = captureSnapshot();
      inTransitionRef.current = true;

      window.setTimeout(() => {
        inTransitionRef.current = false;
      }, 2000);

      // Phones / tablets — overlay keeps watermark; native video FS shows only the <video>
      if (prefersOverlayFullscreen()) {
        setIsLightboxOpen(true);
        void resumePlayback(snapshot, { fromUserGesture });
        return;
      }

      // iOS Safari — native video fullscreen hides browser chrome
      if (isIOSDevice() && video && isVideoSelected) {
        try {
          const entered = await requestVideoFullscreen(video);
          if (entered) {
            setIsNativeVideoFullscreen(true);
            void resumePlayback(snapshot, { fromUserGesture });
            return;
          }
        } catch {
          // fall through
        }
      }

      // Android / desktop — Fullscreen API hides browser navigation bar
      if (supportsElementFullscreen()) {
        const targets = [frame, video].filter(Boolean);
        for (const target of targets) {
          try {
            await requestElementFullscreen(target);
            isFullscreenRef.current = true;
            setIsFullscreen(true);
            void resumePlayback(snapshot, { fromUserGesture });
            return;
          } catch {
            // try next target
          }
        }
      }

      // Last resort — CSS overlay (browser chrome stays visible)
      setIsLightboxOpen(true);
      void resumePlayback(snapshot, { fromUserGesture });
    },
    [captureSnapshot, resumePlayback, isVideoSelected],
  );

  const exitFullscreen = useCallback(async () => {
    const closingLightbox = isLightboxOpen;
    const snapshot = captureSnapshot();

    if (closingLightbox && snapshot.wasPlaying && !userPausedRef.current) {
      pendingLightboxResumeRef.current = snapshot;
    }

    if (closingLightbox) {
      inTransitionRef.current = false;
    } else {
      inTransitionRef.current = true;
      window.setTimeout(() => {
        inTransitionRef.current = false;
      }, 2000);
    }

    const video = videoRef.current;
    const fsEl = getFullscreenElement();

    if (fsEl) {
      try {
        await exitDocumentFullscreen();
      } catch {
        // ignore
      }
    } else if (video && isVideoNativeFullscreen(video)) {
      exitVideoFullscreen(video);
    }

    isFullscreenRef.current = false;
    setIsFullscreen(false);
    setIsNativeVideoFullscreen(false);
    setIsLightboxOpen(false);

    if (!closingLightbox) {
      void resumePlayback(snapshot, { fromUserGesture: true });
    }
  }, [captureSnapshot, resumePlayback, isLightboxOpen]);

  const handleExitImmersive = useCallback(
    (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      void exitFullscreen();
    },
    [exitFullscreen],
  );

  const toggleFullscreen = useCallback(
    async (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      const isCurrentlyImmersive =
        isFullscreen || isLightboxOpen || isNativeVideoFullscreen ||
        Boolean(
          frameRef.current &&
            (getFullscreenElement() === frameRef.current ||
              getFullscreenElement() === videoRef.current),
        );

      if (isCurrentlyImmersive) {
        await exitFullscreen();
      } else {
        await enterFullscreen({ fromUserGesture: true });
      }
    },
    [isFullscreen, isLightboxOpen, isNativeVideoFullscreen, exitFullscreen, enterFullscreen],
  );

  // ─── Browser fullscreenchange sync ──────────────────────────────────────

  useEffect(() => {
    const onFullscreenChange = () => {
      const frame = frameRef.current;
      const video = videoRef.current;
      const fsEl = getFullscreenElement();
      const nowFullscreen = Boolean(
        (frame && fsEl === frame) || (video && fsEl === video),
      );
      const wasFullscreen = isFullscreenRef.current;

      isFullscreenRef.current = nowFullscreen;
      setIsFullscreen(nowFullscreen);

      const snapshot = playbackSnapshotRef.current;

      if (nowFullscreen && !wasFullscreen) {
        void resumePlayback(snapshot, { fromUserGesture: true });
      }

      // Browser-initiated exit (e.g. Esc key): restore playback
      if (wasFullscreen && !nowFullscreen && !inTransitionRef.current) {
        void resumePlayback(snapshot, { fromUserGesture: true });
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, [resumePlayback]);

  // Native iOS video fullscreen
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSelected) return undefined;

    const onBegin = () => setIsNativeVideoFullscreen(true);
    const onEnd = () => {
      setIsNativeVideoFullscreen(false);
      if (!userPausedRef.current) {
        void resumePlayback(playbackSnapshotRef.current, { fromUserGesture: true });
      }
    };

    video.addEventListener('webkitbeginfullscreen', onBegin);
    video.addEventListener('webkitendfullscreen', onEnd);
    return () => {
      video.removeEventListener('webkitbeginfullscreen', onBegin);
      video.removeEventListener('webkitendfullscreen', onEnd);
    };
  }, [isVideoSelected, selectedItem?.src, resumePlayback]);

  // Resume after lightbox / immersive state settles (same video element, no remount)
  useEffect(() => {
    if (!isImmersive || userPausedRef.current) return undefined;

    const snapshot = playbackSnapshotRef.current;
    if (!snapshot.wasPlaying) return undefined;

    const timer = window.setTimeout(() => {
      void resumePlayback(snapshot, { fromUserGesture: true });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [isImmersive, isLightboxOpen, isFullscreen, isNativeVideoFullscreen, resumePlayback]);

  // Resume inline video after mobile/tablet lightbox closes (portal remounts the player).
  useEffect(() => {
    if (isLightboxOpen || !pendingLightboxResumeRef.current) return undefined;

    const snapshot = pendingLightboxResumeRef.current;
    pendingLightboxResumeRef.current = null;
    inTransitionRef.current = false;

    const delays = [0, 120, 300, 600, 1000];
    const timers = delays.map((delay) =>
      window.setTimeout(() => {
        if (userPausedRef.current || isLightboxOpen) return;
        void resumePlayback(snapshot, { fromUserGesture: true });
      }, delay),
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [isLightboxOpen, resumePlayback]);

  // Portal lightbox to <body> via createPortal (keeps React click handlers working).
  useEffect(() => {
    document.documentElement.classList.toggle('media-lightbox-open', isLightboxOpen);
    document.body.classList.toggle('media-lightbox-open', isLightboxOpen);

    return () => {
      document.documentElement.classList.remove('media-lightbox-open');
      document.body.classList.remove('media-lightbox-open');
    };
  }, [isLightboxOpen]);

  // ─── Lightbox keyboard + scroll lock ─────────────────────────────────────

  useEffect(() => {
    if (!isLightboxOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') exitFullscreen();
    };

    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    const updateVH = () => {
      const h = window.visualViewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--media-lightbox-height', `${h}px`);
    };
    updateVH();

    window.addEventListener('keydown', onKeyDown);
    window.visualViewport?.addEventListener('resize', updateVH);
    window.visualViewport?.addEventListener('scroll', updateVH);

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      document.documentElement.style.removeProperty('--media-lightbox-height');
      window.removeEventListener('keydown', onKeyDown);
      window.visualViewport?.removeEventListener('resize', updateVH);
      window.visualViewport?.removeEventListener('scroll', updateVH);
      window.scrollTo(0, scrollY);
    };
  }, [isLightboxOpen, exitFullscreen]);

  // ─── Video src preload ───────────────────────────────────────────────────

  useEffect(() => {
    if (!isVideoSelected || !selectedItem?.src) return undefined;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'video';
    link.href = selectedItem.src;
    document.head.appendChild(link);
    return () => link.remove();
  }, [isVideoSelected, selectedItem?.src, product?.id]);

  // ─── Reset on product change ─────────────────────────────────────────────

  useEffect(() => {
    loadedVideoSrcRef.current = '';
    cancelPendingPlay();
    inTransitionRef.current = false;
    pendingLightboxResumeRef.current = null;
    setSelectedMediaIndex(getDefaultMediaIndex(mediaItems));
    setIsVideoPlaying(false);
    setIsVideoBuffering(false);
    userPausedRef.current = false;
    setIsMuted(true);
    setIsLightboxOpen(false);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setVideoBufferedEnd(0);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Load new video src ──────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    const nextSrc = selectedItem?.src || '';
    if (!video || !isVideoSelected || !nextSrc) return;

    if (loadedVideoSrcRef.current !== nextSrc) {
      loadedVideoSrcRef.current = nextSrc;
      cancelPendingPlay();
      video.load();
      setIsVideoPlaying(false);
      setIsVideoBuffering(true);
      setVideoCurrentTime(0);
      setVideoDuration(0);
      setVideoBufferedEnd(0);
    }
  }, [product?.id, selectedItem?.src, isVideoSelected, cancelPendingPlay]);

  // ─── Progress tracking ───────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSelected) return undefined;

    const sync = () => {
      setVideoCurrentTime(video.currentTime || 0);
      setVideoDuration(Number.isFinite(video.duration) ? video.duration : 0);
      setVideoBufferedEnd(getBufferedEnd(video));
    };

    sync();
    video.addEventListener('timeupdate', sync);
    video.addEventListener('progress', sync);
    video.addEventListener('loadedmetadata', sync);
    video.addEventListener('durationchange', sync);
    video.addEventListener('seeked', sync);

    return () => {
      video.removeEventListener('timeupdate', sync);
      video.removeEventListener('progress', sync);
      video.removeEventListener('loadedmetadata', sync);
      video.removeEventListener('durationchange', sync);
      video.removeEventListener('seeked', sync);
    };
  }, [isVideoSelected, selectedItem?.src, product?.id]);

  // ─── Buffering indicators ────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSelected) return undefined;

    const onWaiting = () => {
      if (!userPausedRef.current && !inTransitionRef.current) setIsVideoBuffering(true);
    };
    const onStalled = () => {
      if (!userPausedRef.current && !inTransitionRef.current) setIsVideoBuffering(true);
    };
    const onPlaying = () => {
      setIsVideoPlaying(true);
      setIsVideoBuffering(false);
    };
    const onPause = () => {
      // Only update state if this is a real pause (not a transition artifact)
      if (!inTransitionRef.current) {
        setIsVideoPlaying(false);
        setIsVideoBuffering(false);
      }
    };
    const onEnded = () => {
      if (!inTransitionRef.current) {
        userPausedRef.current = true;
        setIsVideoPlaying(false);
        setIsVideoBuffering(false);
      }
    };
    const onError = () => {
      setIsVideoPlaying(false);
      setIsVideoBuffering(false);
    };

    video.addEventListener('waiting', onWaiting);
    video.addEventListener('stalled', onStalled);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('stalled', onStalled);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
    };
  }, [isVideoSelected, selectedItem?.src, product?.id]);

  // ─── Auto-start playback when video is ready ──────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSelected || userPausedRef.current || isLightboxOpen) return undefined;

    let cancelled = false;
    const snapshot = playbackSnapshotRef.current;

    const startAuto = async () => {
      if (cancelled || userPausedRef.current || inTransitionRef.current) return;
      if (!video.paused && !video.ended) {
        setIsVideoPlaying(true);
        setIsVideoBuffering(false);
        return;
      }

      if (snapshot.wasPlaying) {
        await resumePlayback(snapshot, { fromUserGesture: false });
        return;
      }

      await safePlay({ fromUserGesture: false });
    };

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      startAuto();
    } else {
      setIsVideoBuffering(true);
      video.addEventListener('canplay', startAuto, { once: true });
    }

    return () => {
      cancelled = true;
      video.removeEventListener('canplay', startAuto);
    };
  }, [isVideoSelected, selectedItem?.src, product?.id, isLightboxOpen, safePlay, resumePlayback]);

  // ─── Keep muted state in sync ────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  // ─── User interaction handlers ───────────────────────────────────────────

  const toggleVideoPlay = useCallback(
    async (event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();

      const video = videoRef.current;
      if (!video) return;

      if (!video.paused && !video.ended) {
        // Currently playing → pause it
        userPausedRef.current = true;
        safePause();
        return;
      }

      // Currently paused → play it
      userPausedRef.current = false;
      // If ended, restart from beginning
      if (video.ended) video.currentTime = 0;
      await safePlay({ fromUserGesture: true });
    },
    [safePlay, safePause],
  );

  const toggleVideoMute = useCallback(() => {
    const video = videoRef.current;
    const next = !isMuted;
    if (video) video.muted = next;
    setIsMuted(next);
  }, [isMuted]);

  const handleSeek = useCallback(
    (event) => {
      const video = videoRef.current;
      const bar = progressBarRef.current;
      if (!video || !bar || !videoDuration) return;

      const rect = bar.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const targetTime = ratio * videoDuration;
      video.currentTime = targetTime;
      setVideoCurrentTime(targetTime);
      setVideoBufferedEnd(getBufferedEnd(video));

      // If user was paused, seeking should restart playback
      if (userPausedRef.current) {
        userPausedRef.current = false;
        safePlay({ fromUserGesture: true, seekTo: targetTime });
      }
    },
    [videoDuration, safePlay],
  );

  const selectMedia = useCallback((index) => {
    setIsLightboxOpen(false);
    cancelPendingPlay();
    const video = videoRef.current;
    if (video) video.pause();
    userPausedRef.current = false;
    setSelectedMediaIndex(index);
    setIsVideoPlaying(false);
    loadedVideoSrcRef.current = '';
  }, [cancelPendingPlay]);

  const handlePrevMedia = useCallback(() => {
    selectMedia(selectedMediaIndex === 0 ? mediaItems.length - 1 : selectedMediaIndex - 1);
  }, [selectMedia, selectedMediaIndex, mediaItems.length]);

  const handleNextMedia = useCallback(() => {
    selectMedia(selectedMediaIndex === mediaItems.length - 1 ? 0 : selectedMediaIndex + 1);
  }, [selectMedia, selectedMediaIndex, mediaItems.length]);

  // ─── Progress bar renderers ───────────────────────────────────────────────

  const playedPercent = videoDuration ? Math.min(100, (videoCurrentTime / videoDuration) * 100) : 0;
  const bufferedPercent = videoDuration ? Math.min(100, (videoBufferedEnd / videoDuration) * 100) : 0;

  const renderVideoProgressBar = (variant = 'inline') => {
    const isOverlay = variant === 'overlay';
    const commonProps = {
      ref: progressBarRef,
      role: 'slider',
      'aria-label': 'Video progress',
      'aria-valuemin': 0,
      'aria-valuemax': videoDuration || 0,
      'aria-valuenow': videoCurrentTime,
      tabIndex: 0,
      onClick: handleSeek,
      onKeyDown: (e) => {
        const video = videoRef.current;
        if (!video || !videoDuration) return;
        if (e.key === 'ArrowRight') video.currentTime = Math.min(videoDuration, video.currentTime + 5);
        if (e.key === 'ArrowLeft') video.currentTime = Math.max(0, video.currentTime - 5);
      },
    };

    if (isOverlay) {
      return (
        <div className="min-w-[140px] flex-1">
          <div {...commonProps} className="relative h-1 w-full cursor-pointer rounded-full bg-white/25">
            <div className="absolute inset-y-0 left-0 rounded-full bg-white/45" style={{ width: `${bufferedPercent}%` }} />
            <div className="absolute inset-y-0 left-0 rounded-full bg-white" style={{ width: `${playedPercent}%` }} />
          </div>
        </div>
      );
    }

    return (
      <div className="mt-2 w-full min-w-0 max-w-full">
        <div {...commonProps} className="relative h-1 w-full cursor-pointer rounded-full bg-gray-200">
          <div className="absolute inset-y-0 left-0 rounded-full bg-gray-300" style={{ width: `${bufferedPercent}%` }} />
          <div className="absolute inset-y-0 left-0 rounded-full bg-gray-900" style={{ width: `${playedPercent}%` }} />
        </div>
      </div>
    );
  };

  // ─── JSX ─────────────────────────────────────────────────────────────────

  if (!mediaItems.length) return null;

  const mediaContent = (
    <>
      {isVideoSelected ? (
        <div className="relative flex h-full w-full items-center justify-center">
          <video
            ref={videoRef}
            src={selectedItem.src}
            poster={selectedItem.poster}
            className={`${isImmersive ? 'h-full w-full' : 'max-h-full max-w-full'} cursor-pointer object-contain ${PROTECTED_MEDIA_CLASS}`}
            playsInline
            muted={isMuted}
            preload={shouldBufferVideo ? 'auto' : 'none'}
            onClick={toggleVideoPlay}
            {...getProtectedVideoProps()}
          />

          {isVideoBuffering && (
            <div className={bufferingOverlayClass} aria-live="polite" aria-busy="true" aria-label="Loading video">
              <FourCircleLoader />
            </div>
          )}

          {!isVideoPlaying && !isVideoBuffering && !isImmersive && (
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

          {!isImmersive && (
            <div className="media-controls-bar absolute bottom-3 left-3 z-20 flex items-center gap-2">
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
    <div className="pointer-events-none absolute inset-0 z-30">
      <div
        className={`pointer-events-auto absolute rounded-full bg-black/80 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white ${
          compact ? 'left-3 top-3' : 'left-4 top-4'
        } ${isVideoSelected ? '' : 'uppercase'}`}
      >
        {isVideoSelected ? '40 Sec Preview Demo Only!' : 'Preview'}
      </div>

      <button
        type="button"
        onClick={isImmersive ? handleExitImmersive : toggleFullscreen}
        className={`pointer-events-auto absolute ${compact ? 'right-3 top-3' : 'right-4 top-4'} ${fullscreenButtonClass} ${isImmersive ? '!z-[120] touch-manipulation' : 'z-30'}`}
        aria-label={isImmersive ? 'Exit fullscreen' : 'View fullscreen'}
        title={isImmersive ? 'Exit fullscreen' : 'Fullscreen'}
      >
        {isImmersive ? (
          <IconMinimize className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
        ) : (
          <IconMaximize className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
        )}
      </button>

      {mediaItems.length > 1 && !isImmersive && (
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
    'aspect-[3/4] w-full min-h-[320px] max-h-[min(92vw,680px)] overflow-hidden rounded-xl border border-gray-200 bg-black shadow-lg sm:aspect-video sm:min-h-[300px] sm:max-h-[min(80vw,600px)] sm:rounded-2xl xl:min-h-[420px] xl:max-h-none xl:aspect-[4/3]';

  const renderMediaFrame = (mode) => (
    <ProtectedMediaFrame
      ref={frameRef}
      watermark
      className={mode === 'lightbox' ? 'media-lightbox__frame' : inlineFrameClassName}
    >
      {renderMediaChrome(mode === 'inline')}
      <div className={mode === 'lightbox' ? 'media-lightbox__media' : 'relative h-full w-full'}>
        {mediaContent}
      </div>
    </ProtectedMediaFrame>
  );

  const lightboxPortal = isLightboxOpen
    ? createPortal(
        <div
          className="media-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen media preview"
        >
          {renderMediaFrame('lightbox')}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="w-full min-w-0 max-w-full">
      {isLightboxOpen ? (
        <div className={`${inlineFrameClassName} pointer-events-none invisible`} aria-hidden />
      ) : (
        <div className="relative w-full">{renderMediaFrame('inline')}</div>
      )}

      {lightboxPortal}

      {isVideoSelected && !isImmersive && renderVideoProgressBar('inline')}

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
