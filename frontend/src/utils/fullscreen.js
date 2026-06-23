export const getFullscreenElement = () =>
  document.fullscreenElement ||
  document.webkitFullscreenElement ||
  document.msFullscreenElement ||
  null;

export const isIOSDevice = () => {
  if (typeof navigator === 'undefined') return false;

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

export const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
};

/** Touch-first layouts (phones/tablets) — overlay lightbox is more reliable than element fullscreen for video. */
export const prefersOverlayFullscreen = () => {
  if (isIOSDevice()) return true;
  if (typeof window === 'undefined') return false;

  // Phone / small tablet — always use overlay (also works in devtools mobile emulation)
  if (window.matchMedia('(max-width: 1024px)').matches) return true;

  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const noHover = window.matchMedia('(hover: none)').matches;
  const touchPoints = navigator.maxTouchPoints > 0;
  const narrowViewport = window.matchMedia('(max-width: 1280px)').matches;

  return narrowViewport && (coarsePointer || noHover || touchPoints);
};

export const supportsElementFullscreen = () => {
  if (typeof document === 'undefined') return false;

  const element = document.createElement('div');
  return Boolean(
    element.requestFullscreen ||
      element.webkitRequestFullscreen ||
      element.msRequestFullscreen,
  );
};

export const isVideoNativeFullscreen = (video) =>
  Boolean(video?.webkitDisplayingFullscreen);

export const requestElementFullscreen = async (element) => {
  if (!element) return;

  if (element.requestFullscreen) {
    await element.requestFullscreen();
    return;
  }

  if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
    return;
  }

  if (element.msRequestFullscreen) {
    element.msRequestFullscreen();
  }
};

export const requestVideoFullscreen = async (video) => {
  if (!video) return false;

  if (typeof video.webkitEnterFullscreen === 'function') {
    video.webkitEnterFullscreen();
    return true;
  }

  if (video.requestFullscreen) {
    await video.requestFullscreen();
    return true;
  }

  if (video.webkitRequestFullscreen) {
    video.webkitRequestFullscreen();
    return true;
  }

  return false;
};

export const exitDocumentFullscreen = async () => {
  if (document.exitFullscreen) {
    await document.exitFullscreen();
    return;
  }

  if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
    return;
  }

  if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
};

export const exitVideoFullscreen = (video) => {
  if (!video) return;

  if (typeof video.webkitExitFullscreen === 'function' && video.webkitDisplayingFullscreen) {
    video.webkitExitFullscreen();
    return;
  }

  if (getFullscreenElement() === video) {
    exitDocumentFullscreen();
  }
};

export const toggleElementFullscreen = async (element) => {
  if (getFullscreenElement() === element) {
    await exitDocumentFullscreen();
    return;
  }

  await requestElementFullscreen(element);
};
