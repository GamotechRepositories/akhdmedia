import { useEffect, useState } from 'react';

/** Matches HeroCarousel layout breakpoints (md=768, lg=1024). */
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState(() => {
    if (typeof window === 'undefined') return 'mobile';
    if (window.matchMedia('(min-width: 1024px)').matches) return 'desktop';
    if (window.matchMedia('(min-width: 768px)').matches) return 'tablet';
    return 'mobile';
  });

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 1024px)');
    const tabletQuery = window.matchMedia('(min-width: 768px)');

    const update = () => {
      if (desktopQuery.matches) setBreakpoint('desktop');
      else if (tabletQuery.matches) setBreakpoint('tablet');
      else setBreakpoint('mobile');
    };

    update();
    desktopQuery.addEventListener('change', update);
    tabletQuery.addEventListener('change', update);
    return () => {
      desktopQuery.removeEventListener('change', update);
      tabletQuery.removeEventListener('change', update);
    };
  }, []);

  return breakpoint;
};
