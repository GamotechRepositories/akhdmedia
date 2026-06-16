const captureFrame = (video) =>
  new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    if (!width || !height) {
      reject(new Error('Video dimensions unavailable'));
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      reject(new Error('Canvas unavailable'));
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error('Could not capture video frame'));
      },
      'image/jpeg',
      0.85,
    );
  });

const captureVideoPosterFromElement = (video) =>
  new Promise((resolve, reject) => {
    const cleanup = () => {
      video.onloadeddata = null;
      video.onseeked = null;
      video.onerror = null;
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('Could not load video'));
    };

    video.onloadeddata = () => {
      try {
        const targetTime = video.duration && Number.isFinite(video.duration)
          ? Math.min(0.5, Math.max(0, video.duration - 0.05))
          : 0.1;
        video.currentTime = targetTime;
      } catch {
        captureFrame(video).then(resolve).catch(reject).finally(cleanup);
      }
    };

    video.onseeked = () => {
      captureFrame(video).then(resolve).catch(reject).finally(cleanup);
    };
  });

export const captureVideoPosterFromFile = (file) => {
  if (!file) {
    return Promise.reject(new Error('No video file provided'));
  }

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = objectUrl;

  return captureVideoPosterFromElement(video).finally(() => {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute('src');
    video.load();
  });
};

export const captureVideoPosterFromUrl = (url) => {
  if (!url) {
    return Promise.reject(new Error('No video URL provided'));
  }

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.crossOrigin = 'anonymous';
  video.src = url;

  return captureVideoPosterFromElement(video).finally(() => {
    video.removeAttribute('src');
    video.load();
  });
};
