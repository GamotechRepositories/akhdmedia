import { useEffect, useRef } from 'react';

export const InfiniteScrollSentinel = ({ onVisible, disabled = false }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (disabled) return undefined;

    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible();
        }
      },
      { rootMargin: '240px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, onVisible]);

  return <div ref={ref} aria-hidden="true" className="h-1 w-full" />;
};

export default InfiniteScrollSentinel;
