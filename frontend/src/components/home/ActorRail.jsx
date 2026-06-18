import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PAGE_CONTAINER } from '../../constants/layout';
import { useHorizontalDragScroll } from '../../hooks/useHorizontalDragScroll';
import OptimizedImage from '../ui/OptimizedImage';

const AUTO_SCROLL_MS = 4000;
const AUTO_SCROLL_STEP = 2;
const HOVER_EDGE_SCROLL_MS = 500;
const HOVER_SCROLL_STEP = 2;

const SCROLL_ROW_CLASS =
  '-mx-4 flex w-max max-w-full snap-x snap-mandatory gap-4 overflow-x-auto px-4 pt-0.5 pb-2 scrollbar-hide sm:gap-6 md:mx-0 md:px-0';

const scrollToActorIndex = (container, index) => {
  const card = container?.children[index];
  if (!container || !card) return;

  container.scrollTo({
    left: card.offsetLeft - container.offsetLeft,
    behavior: 'smooth',
  });
};

const ActorScrollRow = ({ itemCount, enableAutoScroll = false, children }) => {
  const { scrollRef, isScrollable, shouldPreventClick, dragHandlers } =
    useHorizontalDragScroll(itemCount);
  const hoverScrollLockRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  const pauseAutoScroll = useCallback(() => {
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }
    setIsPaused(true);
  }, []);

  const resumeAutoScrollLater = useCallback(() => {
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => setIsPaused(false), 3500);
  }, []);

  useEffect(
    () => () => {
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!enableAutoScroll || !isScrollable || itemCount <= 1 || isPaused) return undefined;

    const timer = window.setInterval(() => {
      const container = scrollRef.current;
      if (!container) return;

      const cards = Array.from(container.children);
      if (!cards.length) return;

      const containerRect = container.getBoundingClientRect();
      let lastVisibleIndex = 0;

      cards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect();
        if (cardRect.left < containerRect.right - 8) {
          lastVisibleIndex = index;
        }
      });

      const nextIndex =
        lastVisibleIndex + AUTO_SCROLL_STEP >= itemCount
          ? 0
          : lastVisibleIndex + AUTO_SCROLL_STEP;

      scrollToActorIndex(container, nextIndex);
    }, AUTO_SCROLL_MS);

    return () => window.clearInterval(timer);
  }, [enableAutoScroll, isScrollable, isPaused, itemCount, scrollRef]);

  const handleActorHover = useCallback(
    (index) => {
      if (!enableAutoScroll || !isScrollable || hoverScrollLockRef.current) return;

      const container = scrollRef.current;
      if (!container) return;

      const cards = Array.from(container.children);
      const card = cards[index];
      if (!card) return;

      const containerRect = container.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const edgeGap = 20;
      const nextCard = cards[index + 1];
      const prevCard = cards[index - 1];
      const nextCardRect = nextCard?.getBoundingClientRect();
      const prevCardRect = prevCard?.getBoundingClientRect();

      const isOnRightEdge = cardRect.right >= containerRect.right - edgeGap;
      const isSecondFromRightEdge = Boolean(
        nextCardRect && nextCardRect.right >= containerRect.right - edgeGap,
      );
      const isOnLeftEdge = cardRect.left <= containerRect.left + edgeGap;
      const isSecondFromLeftEdge = Boolean(
        prevCardRect && prevCardRect.left <= containerRect.left + edgeGap,
      );

      let targetIndex = null;
      if (index < itemCount - 1 && (isOnRightEdge || isSecondFromRightEdge)) {
        targetIndex = Math.min(index + HOVER_SCROLL_STEP, itemCount - 1);
      } else if (index > 0 && (isOnLeftEdge || isSecondFromLeftEdge)) {
        targetIndex = Math.max(index - HOVER_SCROLL_STEP, 0);
      }

      if (targetIndex === null || targetIndex === index) return;

      hoverScrollLockRef.current = true;
      scrollToActorIndex(container, targetIndex);
      window.setTimeout(() => {
        hoverScrollLockRef.current = false;
      }, HOVER_EDGE_SCROLL_MS);
    },
    [enableAutoScroll, isScrollable, itemCount, scrollRef],
  );

  return (
    <div className="flex justify-center">
      <div
        ref={scrollRef}
        {...dragHandlers}
        onMouseDown={(event) => {
          dragHandlers.onMouseDown?.(event);
          pauseAutoScroll();
        }}
        onMouseEnter={pauseAutoScroll}
        onMouseLeave={resumeAutoScrollLater}
        onTouchStart={pauseAutoScroll}
        onTouchEnd={resumeAutoScrollLater}
        className={`${SCROLL_ROW_CLASS}${isScrollable ? ' cursor-grab' : ''}`}
        aria-label={isScrollable ? 'Actors list. Drag or scroll with mouse to browse.' : undefined}
      >
        {children(shouldPreventClick, handleActorHover)}
      </div>
    </div>
  );
};

const ActorRail = ({ actors = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <section className="border-b border-gray-100 bg-white pt-10 pb-2 sm:pt-12 sm:pb-3">
        <div className={PAGE_CONTAINER}>
          <ActorScrollRow itemCount={6}>
            {() =>
              Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="w-[92px] shrink-0 sm:w-[108px]">
                  <div className="aspect-square animate-pulse rounded-full border-2 border-gray-200 bg-gray-200" />
                  <div className="mx-auto mt-3 h-3 w-16 animate-pulse rounded bg-gray-200" />
                </div>
              ))
            }
          </ActorScrollRow>
        </div>
      </section>
    );
  }

  if (actors.length === 0) return null;

  return (
    <section className="border-b border-gray-100 bg-white pt-10 pb-2 sm:pt-12 sm:pb-3">
      <div className={PAGE_CONTAINER}>
        <ActorScrollRow itemCount={actors.length} enableAutoScroll>
          {(shouldPreventClick, handleActorHover) =>
            actors.map((actor, index) => (
              <Link
                key={actor.id}
                to={`/videos?actor=${encodeURIComponent(actor.id)}`}
                draggable={false}
                onMouseEnter={() => handleActorHover(index)}
                onClick={(event) => {
                  if (shouldPreventClick()) {
                    event.preventDefault();
                  }
                }}
                className="group w-[92px] shrink-0 snap-start text-center sm:w-[108px]"
              >
                <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100 transition-colors group-hover:border-gray-900">
                  {actor.image ? (
                    <OptimizedImage
                      src={actor.image}
                      alt={actor.name}
                      width={216}
                      height={216}
                      quality={85}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-200 text-2xl font-bold text-gray-500">
                      {actor.name?.charAt(0) || '?'}
                    </div>
                  )}
                </div>
                <p className="mt-3 line-clamp-2 text-xs font-semibold text-gray-900 sm:text-sm">
                  {actor.name}
                </p>
              </Link>
            ))
          }
        </ActorScrollRow>
      </div>
    </section>
  );
};

export default ActorRail;
