import { useState, useRef, useCallback } from 'react';

export const useMediaPreview = () => {
  const videoRef = useRef(null);
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  const activatePreview = useCallback(() => {
    setIsPreviewActive(true);
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }, []);

  const deactivatePreview = useCallback(() => {
    setIsPreviewActive(false);
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }, []);

  return {
    videoRef,
    isPreviewActive,
    activatePreview,
    deactivatePreview,
  };
};
