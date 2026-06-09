import { useState, useCallback } from 'react';

export const useStoryViewer = (storyCount) => {
  const [activeIndex, setActiveIndex] = useState(null);

  const isOpen = activeIndex !== null;

  const open = useCallback((index) => setActiveIndex(index), []);
  const close = useCallback(() => setActiveIndex(null), []);

  const goNext = useCallback(() => {
    setActiveIndex((current) =>
      current === null || current >= storyCount - 1 ? current : current + 1
    );
  }, [storyCount]);

  const goPrev = useCallback(() => {
    setActiveIndex((current) =>
      current === null || current <= 0 ? current : current - 1
    );
  }, []);

  return { activeIndex, isOpen, open, close, goNext, goPrev };
};
