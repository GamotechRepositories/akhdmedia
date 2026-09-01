export const PROTECTED_MEDIA_CLASS = 'protected-media';

const MEDIA_SELECTOR =
  'img.protected-media, video.protected-media, .protected-media, .protected-media-shell, .protected-media-watermark, .protected-media-shield';

export const preventMediaContextMenu = (event) => {
  event.preventDefault();
  event.stopPropagation();
};

export const preventMediaDrag = (event) => {
  event.preventDefault();
  event.stopPropagation();
};

export const getProtectedImageProps = () => ({
  draggable: false,
  onContextMenu: preventMediaContextMenu,
  onDragStart: preventMediaDrag,
});

export const getProtectedVideoProps = () => ({
  controls: false,
  controlsList: 'nodownload noplaybackrate noremoteplayback',
  disablePictureInPicture: true,
  disableRemotePlayback: true,
  playsInline: true,
  preload: 'metadata',
  draggable: false,
  onContextMenu: preventMediaContextMenu,
  onDragStart: preventMediaDrag,
});

export const getProtectedMediaShellProps = () => ({
  onContextMenu: preventMediaContextMenu,
  onDragStart: preventMediaDrag,
  className: 'protected-media-shell',
});

const isProtectedMediaTarget = (target) => {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(MEDIA_SELECTOR));
};

const isSaveShortcut = (event) => {
  const key = event.key?.toLowerCase();
  return (event.ctrlKey || event.metaKey) && key === 's';
};

/**
 * Site-wide deterrence against casual download of preview media.
 * Capture-phase listeners beat the browser image/video context menu in most cases.
 * This cannot stop DevTools / network sniffing / screenshots.
 */
export const installMediaDownloadProtection = () => {
  if (typeof document === 'undefined') return () => {};
  if (document.documentElement.dataset.mediaProtection === '1') {
    return () => {};
  }
  document.documentElement.dataset.mediaProtection = '1';

  const onContextMenu = (event) => {
    if (isProtectedMediaTarget(event.target)) {
      preventMediaContextMenu(event);
    }
  };

  const onDragStart = (event) => {
    if (isProtectedMediaTarget(event.target)) {
      preventMediaDrag(event);
    }
  };

  const onKeyDown = (event) => {
    if (!isSaveShortcut(event)) return;
    if (isProtectedMediaTarget(event.target) || document.activeElement?.closest?.(MEDIA_SELECTOR)) {
      event.preventDefault();
    }
  };

  const onCopy = (event) => {
    if (isProtectedMediaTarget(event.target)) {
      event.preventDefault();
    }
  };

  document.addEventListener('contextmenu', onContextMenu, true);
  document.addEventListener('dragstart', onDragStart, true);
  document.addEventListener('keydown', onKeyDown, true);
  document.addEventListener('copy', onCopy, true);

  return () => {
    document.removeEventListener('contextmenu', onContextMenu, true);
    document.removeEventListener('dragstart', onDragStart, true);
    document.removeEventListener('keydown', onKeyDown, true);
    document.removeEventListener('copy', onCopy, true);
    delete document.documentElement.dataset.mediaProtection;
  };
};
