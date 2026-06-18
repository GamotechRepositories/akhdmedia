import { useCallback, useEffect, useRef, useState } from 'react';

const DRAG_THRESHOLD = 5;

export const useHorizontalDragScroll = (dependency = 0) => {
  const scrollRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, scrollLeft: 0, dragged: false });
  const [isScrollable, setIsScrollable] = useState(false);

  const updateScrollable = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setIsScrollable(el.scrollWidth > el.clientWidth + 1);
  }, []);

  useEffect(() => {
    updateScrollable();
    const el = scrollRef.current;
    if (!el) return undefined;

    const observer = new ResizeObserver(updateScrollable);
    observer.observe(el);

    if (el.firstElementChild) {
      observer.observe(el.firstElementChild);
    }

    return () => observer.disconnect();
  }, [dependency, updateScrollable]);

  const onMouseDown = useCallback(
    (event) => {
      const el = scrollRef.current;
      if (!el || !isScrollable || event.button !== 0) return;

      event.preventDefault();

      dragRef.current = {
        active: true,
        startX: event.pageX,
        scrollLeft: el.scrollLeft,
        dragged: false,
      };
      el.classList.add('cursor-grabbing');

      const handleWindowMouseMove = (moveEvent) => {
        if (!dragRef.current.active) return;

        const delta = moveEvent.pageX - dragRef.current.startX;
        if (Math.abs(delta) > DRAG_THRESHOLD) {
          dragRef.current.dragged = true;
        }

        el.scrollLeft = dragRef.current.scrollLeft - delta;
      };

      const handleWindowMouseUp = () => {
        dragRef.current.active = false;
        el.classList.remove('cursor-grabbing');
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
      };

      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    },
    [isScrollable],
  );

  const onWheel = useCallback(
    (event) => {
      const el = scrollRef.current;
      if (!el || !isScrollable) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      event.preventDefault();
      el.scrollLeft += event.deltaY;
    },
    [isScrollable],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel, dependency]);

  const shouldPreventClick = useCallback(() => {
    const dragged = dragRef.current.dragged;
    dragRef.current.dragged = false;
    return dragged;
  }, []);

  return {
    scrollRef,
    isScrollable,
    shouldPreventClick,
    dragHandlers: {
      onMouseDown,
    },
  };
};
