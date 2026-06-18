export const getFullscreenElement = () =>
  document.fullscreenElement ||
  document.webkitFullscreenElement ||
  document.msFullscreenElement ||
  null;

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

export const toggleElementFullscreen = async (element) => {
  if (getFullscreenElement() === element) {
    await exitDocumentFullscreen();
    return;
  }

  await requestElementFullscreen(element);
};
