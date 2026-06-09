import { useState, useEffect, useCallback, useRef } from 'react';

const DEFAULT_INTERVAL = 6000;

export const useCarousel = (itemCount, interval = DEFAULT_INTERVAL) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const goTo = useCallback(
    (index) => {
      if (itemCount <= 0) return;
      setActiveIndex(((index % itemCount) + itemCount) % itemCount);
    },
    [itemCount]
  );

  const next = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const prev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (itemCount <= 1 || isPaused) return undefined;

    timerRef.current = window.setInterval(next, interval);
    return () => window.clearInterval(timerRef.current);
  }, [itemCount, interval, isPaused, next]);

  return {
    activeIndex,
    isPaused,
    goTo,
    next,
    prev,
    pause: () => setIsPaused(true),
    resume: () => setIsPaused(false),
  };
};
