import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { buildProductMediaItems } from '../../constants/mediaTypes';
import { useAuth } from '../../context/AuthContext';
import ProtectedMediaFrame from '../ui/ProtectedMediaFrame';
import OptimizedImage from '../ui/OptimizedImage';
import VideoThumbnail from '../ui/VideoThumbnail';
import YoutubeShortPreview from './YoutubeShortPreview';
import FourCircleLoader from '../ui/FourCircleLoader';
import {
  exitDocumentFullscreen,
  exitVideoFullscreen,
  getFullscreenElement,
  isVideoNativeFullscreen,
  requestElementFullscreen,
  supportsElementFullscreen,
} from '../../utils/fullscreen';
import {
  IconMaximize,
  IconMinimize,
  IconPlayStroke,
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
  const demoIndex = items.findIndex((item) => item.type === 'video' || item.type === 'youtube');
  return demoIndex === -1 ? 0 : demoIndex;
};

const PREVIEW_AUTH_LIMIT_SECONDS = 10;
const PREVIEW_SIGN_IN_MESSAGE =
  'Sign in to continue watching all the videos, details and full previews.';

const ProductMediaGallery = ({ product }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const frameRef = useRef(null);
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  const loadedVideoSrcRef = useRef('');
  const isFullscreenRef = useRef(false);
  const playbackSnapshotRef = useRef({ time: 0, wasPlaying: false });

  // --- Playback control refs (not state, to avoid stale closures) ---
  const userPausedRef = useRef(true);       // true until user clicks play
  const inTransitionRef = useRef(false);    // true during fullscreen enter/exit
  const pendingPlayRef = useRef(null);      // AbortController for in-flight play()
  const pendingLightboxResumeRef = useRef(null);
  const previewGateTriggeredRef = useRef(false);
  const browserFullscreenRef = useRef(false); // document fullscreen active alongside lightbox

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
  const [showPreviewSignInModal, setShowPreviewSignInModal] = useState(false);
  const [isYoutubePlaying, setIsYoutubePlaying] = useState(false);

  const selectedItem = mediaItems[selectedMediaIndex];
  const isVideoSelected = selectedItem?.type === 'video';
  const isYoutubeSelected = selectedItem?.type === 'youtube';
  const isPreviewDemoSelected = isVideoSelected || isYoutubeSelected;
  const isImmersive = isLightboxOpen || isFullscreen || isNativeVideoFullscreen;
  const controlButtonClass = `${videoControlButtonClass} ${isImmersive ? '!z-[120]' : ''}`;
  const playOverlayClass = isImmersive
    ? 'absolute inset-0 z-[110] flex items-center justify-center pointer-events-auto'
    : 'absolute inset-0 z-10 flex items-center justify-center pointer-events-auto';
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

  const clearVideoSource = useCallback(() => {
    loadedVideoSrcRef.current = '';
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
  }, []);

  const loadVideoSource = useCallback(async () => {
    const video = videoRef.current;
    const nextSrc = selectedItem?.src || '';
    if (!video || !nextSrc) return false;

    // Same logical source already attached to this element
    if (loadedVideoSrcRef.current === nextSrc && video.getAttribute('src')) {
      return true;
    }

    // Re-attach after remount (e.g. mobile lightbox portal) — keep progress UI
    const isReattach = loadedVideoSrcRef.current === nextSrc;

    loadedVideoSrcRef.current = nextSrc;
    video.src = nextSrc;
    video.load();

    if (!isReattach) {
      previewGateTriggeredRef.current = false;
      setVideoCurrentTime(0);
      setVideoDuration(0);
      setVideoBufferedEnd(0);
    }

    await new Promise((resolve) => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        resolve();
        return;
      }
      const onReady = () => resolve();
      video.addEventListener('canplay', onReady, { once: true });
      video.addEventListener('error', onReady, { once: true });
      window.setTimeout(onReady, 10000);
    });

    return true;
  }, [selectedItem?.src]);

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
      // eslint-disable-next-line no-unused-vars
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

  const openPreviewSignIn = useCallback(() => {
    if (previewGateTriggeredRef.current || isAuthenticated) return;

    previewGateTriggeredRef.current = true;
    userPausedRef.current = true;

    const video = videoRef.current;
    if (video) {
      if (video.currentTime > PREVIEW_AUTH_LIMIT_SECONDS) {
        video.currentTime = PREVIEW_AUTH_LIMIT_SECONDS;
      }
      video.pause();
    }

    setIsVideoPlaying(false);
    setIsVideoBuffering(false);
    setShowPreviewSignInModal(true);
  }, [isAuthenticated]);

  const closePreviewSignInModal = useCallback(() => {
    setShowPreviewSignInModal(false);
    previewGateTriggeredRef.current = false;
  }, []);

  const goToPreviewSignIn = useCallback(() => {
    setShowPreviewSignInModal(false);
    navigate('/login', {
      state: {
        from: `${location.pathname}${location.search}`,
      },
    });
  }, [location.pathname, location.search, navigate]);

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

        // Mobile lightbox remounts <video> without src — reattach before play()
        const loaded = await loadVideoSource();
        if (!loaded || userPausedRef.current) return;

        const activeVideo = videoRef.current;
        if (!activeVideo) return;

        if (!activeVideo.paused && !activeVideo.ended) {
          setIsVideoPlaying(true);
          setIsVideoBuffering(false);
          return;
        }

        if (Number.isFinite(time) && time > 0) {
          const duration = Number.isFinite(activeVideo.duration) ? activeVideo.duration : 0;
          const safeTime = duration > 0 ? Math.min(time, Math.max(0, duration - 0.05)) : time;
          if (Math.abs(activeVideo.currentTime - safeTime) > 0.25) {
            activeVideo.currentTime = safeTime;
          }
        }

        if (activeVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          await new Promise((resolve) => {
            if (activeVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
              resolve();
              return;
            }
            activeVideo.addEventListener('canplay', resolve, { once: true });
            window.setTimeout(resolve, 2000);
          });
        }

        try {
          activeVideo.muted = isMuted;
          await activeVideo.play();
          setIsVideoPlaying(true);
          setIsVideoBuffering(false);
          return;
        } catch {
          if (fromUserGesture && !activeVideo.muted) {
            try {
              activeVideo.muted = true;
              setIsMuted(true);
              await activeVideo.play();
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
    [isMuted, loadVideoSource],
  );

  // ─── Fullscreen enter/exit ───────────────────────────────────────────────

  // Single code path for all devices (same approach as the mobile app):
  // a dedicated black overlay that centers media by its own aspect ratio,
  // plus browser fullscreen so the address bar / taskbar disappear too.
  // The lightbox-open effect reattaches the video source and resumes playback.
  const enterFullscreen = useCallback(async () => {
    const frame = frameRef.current;
    // YouTube embed has its own fullscreen — skip custom immersive mode
    if (!frame || isYoutubeSelected) return;

    captureSnapshot();
    inTransitionRef.current = true;

    window.setTimeout(() => {
      inTransitionRef.current = false;
    }, 2000);

    setIsLightboxOpen(true);

    // Hide browser chrome (tabs, URL bar, taskbar) — like the app.
    // Unsupported browsers (e.g. iPhone Safari) keep the overlay only.
    if (supportsElementFullscreen() && !getFullscreenElement()) {
      try {
        await requestElementFullscreen(document.documentElement);
        browserFullscreenRef.current = true;
      } catch {
        browserFullscreenRef.current = false;
      }
    }
  }, [captureSnapshot, isYoutubeSelected]);

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

    // Clear before exiting so the fullscreenchange handler doesn't re-run exit
    browserFullscreenRef.current = false;

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
      const fsEl = getFullscreenElement();
      const isCurrentlyImmersive =
        isFullscreen || isLightboxOpen || isNativeVideoFullscreen ||
        // fsEl must be non-null: with an image selected videoRef.current is
        // null, and null === null would falsely report "already fullscreen"
        Boolean(fsEl && (fsEl === frameRef.current || fsEl === videoRef.current));

      if (isCurrentlyImmersive) {
        await exitFullscreen();
      } else {
        await enterFullscreen();
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

      // Esc pressed while document fullscreen + lightbox: close the lightbox too
      if (browserFullscreenRef.current && !fsEl) {
        browserFullscreenRef.current = false;
        if (isLightboxOpen) {
          void exitFullscreen();
        }
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, [resumePlayback, isLightboxOpen, exitFullscreen]);

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

  // Mobile lightbox remounts the player into a portal — reattach src + resume after mount.
  useEffect(() => {
    if (!isLightboxOpen || !isVideoSelected) return undefined;

    let cancelled = false;
    const snapshot = playbackSnapshotRef.current;

    const restore = async () => {
      // Wait one frame so the portaled <video> is in the DOM and videoRef is updated
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
      if (cancelled) return;

      const loaded = await loadVideoSource();
      if (cancelled || !loaded) return;

      const video = videoRef.current;
      if (!video) return;

      if (Number.isFinite(snapshot.time) && snapshot.time > 0) {
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const safeTime =
          duration > 0 ? Math.min(snapshot.time, Math.max(0, duration - 0.05)) : snapshot.time;
        video.currentTime = safeTime;
        setVideoCurrentTime(safeTime);
      }

      // Continue playback if it was already playing when fullscreen was opened
      if (!userPausedRef.current || snapshot.wasPlaying) {
        userPausedRef.current = false;
        setIsVideoBuffering(true);
        await resumePlayback(snapshot, { fromUserGesture: true });
      }
    };

    void restore();

    return () => {
      cancelled = true;
    };
  }, [isLightboxOpen, isVideoSelected, selectedItem?.src, loadVideoSource, resumePlayback]);

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

  // ─── Reset on product change ─────────────────────────────────────────────

  useEffect(() => {
    clearVideoSource();
    cancelPendingPlay();
    inTransitionRef.current = false;
    pendingLightboxResumeRef.current = null;
    previewGateTriggeredRef.current = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedMediaIndex(getDefaultMediaIndex(mediaItems));
    setIsVideoPlaying(false);
    setIsVideoBuffering(false);
    userPausedRef.current = true;
    setIsMuted(true);
    setIsYoutubePlaying(false);
    setIsLightboxOpen(false);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    setVideoBufferedEnd(0);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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
    // isLightboxOpen: the portal remounts <video>, so listeners must rebind
  }, [isVideoSelected, selectedItem?.src, product?.id, isLightboxOpen]);

  useEffect(() => {
    if (isAuthenticated) {
      previewGateTriggeredRef.current = false;
      setShowPreviewSignInModal(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoSelected || isAuthenticated) return undefined;

    const enforcePreviewLimit = () => {
      if (video.currentTime >= PREVIEW_AUTH_LIMIT_SECONDS) {
        video.currentTime = PREVIEW_AUTH_LIMIT_SECONDS;
        openPreviewSignIn();
      }
    };

    video.addEventListener('timeupdate', enforcePreviewLimit);
    return () => video.removeEventListener('timeupdate', enforcePreviewLimit);
  }, [isVideoSelected, isAuthenticated, selectedItem?.src, product?.id, openPreviewSignIn, isLightboxOpen]);

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
    // isLightboxOpen: the portal remounts <video>, so listeners must rebind
  }, [isVideoSelected, selectedItem?.src, product?.id, isLightboxOpen]);

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

      // Currently paused → load source on first play, then start playback
      userPausedRef.current = false;
      setIsVideoBuffering(true);
      const loaded = await loadVideoSource();
      if (!loaded) {
        userPausedRef.current = true;
        setIsVideoBuffering(false);
        return;
      }
      if (video.ended) video.currentTime = 0;
      await safePlay({ fromUserGesture: true });
    },
    [safePlay, safePause, loadVideoSource],
  );

  const toggleVideoMute = useCallback(() => {
    const video = videoRef.current;
    const next = !isMuted;
    if (video) video.muted = next;
    setIsMuted(next);
  }, [isMuted]);

  const handleSeek = useCallback(
    async (event) => {
      const video = videoRef.current;
      const bar = progressBarRef.current;
      if (!video || !bar || !videoDuration) return;

      const rect = bar.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      let targetTime = ratio * videoDuration;

      if (!isAuthenticated) {
        targetTime = Math.min(targetTime, PREVIEW_AUTH_LIMIT_SECONDS);
      }

      if (!loadedVideoSrcRef.current) {
        userPausedRef.current = false;
        setIsVideoBuffering(true);
        const loaded = await loadVideoSource();
        if (!loaded) {
          userPausedRef.current = true;
          setIsVideoBuffering(false);
          return;
        }
      }

      video.currentTime = targetTime;
      setVideoCurrentTime(targetTime);
      setVideoBufferedEnd(getBufferedEnd(video));

      if (!isAuthenticated && targetTime >= PREVIEW_AUTH_LIMIT_SECONDS) {
        userPausedRef.current = true;
        safePause();
        openPreviewSignIn();
        return;
      }

      // If user was paused, seeking should restart playback
      if (userPausedRef.current) {
        userPausedRef.current = false;
        await safePlay({ fromUserGesture: true, seekTo: targetTime });
      }
    },
    [videoDuration, safePlay, isAuthenticated, openPreviewSignIn, safePause, loadVideoSource],
  );

  const selectMedia = useCallback((index, { keepLightbox = false } = {}) => {
    if (!keepLightbox) setIsLightboxOpen(false);
    cancelPendingPlay();
    clearVideoSource();
    userPausedRef.current = true;
    previewGateTriggeredRef.current = false;
    playbackSnapshotRef.current = { time: 0, wasPlaying: false };
    setIsYoutubePlaying(false);
    setSelectedMediaIndex(index);
    setIsVideoPlaying(false);
  }, [cancelPendingPlay, clearVideoSource]);

  const handlePrevMedia = useCallback(() => {
    // Keep fullscreen overlay open while navigating (same as the app lightbox)
    selectMedia(selectedMediaIndex === 0 ? mediaItems.length - 1 : selectedMediaIndex - 1, {
      keepLightbox: isLightboxOpen,
    });
  }, [selectMedia, selectedMediaIndex, mediaItems.length, isLightboxOpen]);

  const handleNextMedia = useCallback(() => {
    selectMedia(selectedMediaIndex === mediaItems.length - 1 ? 0 : selectedMediaIndex + 1, {
      keepLightbox: isLightboxOpen,
    });
  }, [selectMedia, selectedMediaIndex, mediaItems.length, isLightboxOpen]);

  // Leave custom immersive mode on YouTube — the embed has native fullscreen
  useEffect(() => {
    if (!isYoutubeSelected) return;
    if (isFullscreen || isLightboxOpen || isNativeVideoFullscreen) {
      void exitFullscreen();
    }
  }, [isYoutubeSelected, isFullscreen, isLightboxOpen, isNativeVideoFullscreen, exitFullscreen]);

  // ─── Progress bar renderers ───────────────────────────────────────────────

  const playedPercent = videoDuration ? Math.min(100, (videoCurrentTime / videoDuration) * 100) : 0;
  const bufferedPercent = videoDuration ? Math.min(100, (videoBufferedEnd / videoDuration) * 100) : 0;

  const renderVideoProgressBar = (variant = 'inline') => {
    const isOverlay = variant === 'overlay';
    const commonProps = {
      // eslint-disable-next-line react-hooks/refs
      ref: progressBarRef,
      role: 'slider',
      'aria-label': 'Video progress',
      'aria-valuemin': 0,
      'aria-valuemax': videoDuration || 0,
      'aria-valuenow': videoCurrentTime,
      tabIndex: 0,
      // eslint-disable-next-line react-hooks/refs
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
      {isYoutubeSelected ? (
        <YoutubeShortPreview
          url={selectedItem.src}
          poster={selectedItem.poster}
          isAuthenticated={isAuthenticated}
          onPreviewLimit={openPreviewSignIn}
          autoPlay={isYoutubePlaying}
          onPlayingChange={setIsYoutubePlaying}
          className={isImmersive ? 'h-full w-full' : 'max-h-full max-w-full'}
          immersive={isImmersive}
        />
      ) : isVideoSelected ? (
        <div className="relative flex h-full w-full items-center justify-center">
          <video
            ref={videoRef}
            poster={selectedItem.poster}
            className={`${isImmersive ? 'h-full w-full' : 'max-h-full max-w-full'} cursor-pointer object-contain ${PROTECTED_MEDIA_CLASS}`}
            playsInline
            muted={isMuted}
            preload="none"
            onClick={toggleVideoPlay}
            {...getProtectedVideoProps()}
          />

          {isVideoBuffering && (
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
              <IconPlayStroke
                className={`text-white drop-shadow-lg ${
                  isImmersive ? 'h-16 w-16 sm:h-20 sm:w-20' : 'h-12 w-12 sm:h-14 sm:w-14'
                }`}
              />
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
                  <IconPlayStroke className="h-4 w-4" />
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
        <div
          className="flex h-full w-full items-center justify-center"
          onClick={isImmersive ? undefined : toggleFullscreen}
        >
          <OptimizedImage
            src={selectedItem.src}
            alt={product.name}
            width={1200}
            height={1200}
            quality={80}
            className={`max-h-full max-w-full object-contain ${
              isImmersive ? '' : 'cursor-zoom-in'
            } ${PROTECTED_MEDIA_CLASS}`}
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
        } ${isPreviewDemoSelected ? '' : 'uppercase'}`}
      >
        {isPreviewDemoSelected ? (isYoutubeSelected ? 'YouTube Short Preview' : '40 Sec Preview Demo Only!') : 'Preview'}
      </div>

      {/* YouTube Shorts already expose native fullscreen in the embed player */}
      {!isYoutubeSelected && (
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
      )}

      {mediaItems.length > 1 && (!isImmersive || !isPreviewDemoSelected) && (
        <div
          className={`pointer-events-auto absolute flex gap-1.5 ${
            compact ? 'bottom-3' : 'bottom-4'
          } ${
            isYoutubeSelected && isYoutubePlaying
              ? compact
                ? 'left-3'
                : 'left-4'
              : compact
                ? 'right-3'
                : 'right-4'
          }`}
        >
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

      {showPreviewSignInModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[10100] flex min-h-[100dvh] items-center justify-center overflow-y-auto bg-black/50 px-4 py-6"
            onClick={closePreviewSignInModal}
          >
            <div
              className="my-auto w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="preview-sign-in-title"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <svg className="h-6 w-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 id="preview-sign-in-title" className="text-lg font-bold text-gray-900">
                Sign in
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">{PREVIEW_SIGN_IN_MESSAGE}</p>
              <button
                type="button"
                onClick={goToPreviewSignIn}
                className="mt-6 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Sign in
              </button>
            </div>
          </div>,
          document.body,
        )}

      {isVideoSelected && !isImmersive && renderVideoProgressBar('inline')}

      {mediaItems.length > 1 && (
        <div className={`flex gap-2 overflow-x-auto pb-1 scrollbar-hide sm:gap-2.5 ${isPreviewDemoSelected ? 'mt-2' : 'mt-3'}`}>
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
              ) : item.type === 'youtube' ? (
                <>
                  {item.poster ? (
                    <OptimizedImage
                      src={item.poster}
                      alt="YouTube Short preview"
                      width={192}
                      height={108}
                      quality={70}
                      loading="lazy"
                      className={`h-full w-full object-cover ${PROTECTED_MEDIA_CLASS}`}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-900 text-[10px] font-semibold uppercase tracking-wide text-white/80">
                      YouTube
                    </div>
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
