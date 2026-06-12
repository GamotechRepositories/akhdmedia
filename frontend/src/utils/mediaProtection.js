export const PROTECTED_MEDIA_CLASS = 'protected-media';

export const preventMediaContextMenu = (event) => {
  event.preventDefault();
};

export const preventMediaDrag = (event) => {
  event.preventDefault();
};

export const getProtectedImageProps = () => ({
  draggable: false,
  onContextMenu: preventMediaContextMenu,
  onDragStart: preventMediaDrag,
});

export const getProtectedVideoProps = () => ({
  controls: false,
  controlsList: 'nodownload noplaybackrate nofullscreen',
  disablePictureInPicture: true,
  disableRemotePlayback: true,
  playsInline: true,
  onContextMenu: preventMediaContextMenu,
  onDragStart: preventMediaDrag,
});

export const getProtectedMediaShellProps = () => ({
  onContextMenu: preventMediaContextMenu,
  className: 'protected-media-shell',
});
