import { useLayoutEffect, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const scrollPageToTop = () => {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

const ScrollToTop = () => {
  const { pathname, search, hash, key } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useLayoutEffect(() => {
    if (hash) return;
    scrollPageToTop();
  }, [pathname, search, hash, key]);

  return null;
};

export default ScrollToTop;
