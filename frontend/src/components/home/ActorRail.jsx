import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { PAGE_CONTAINER } from '../../constants/layout';
import { IconChevronLeft, IconChevronRight } from '../icons/Icons';
import OptimizedImage from '../ui/OptimizedImage';

const SCROLL_STEP = 2;

const SCROLL_ROW_CLASS =
  'flex w-full snap-x snap-mandatory gap-4 overflow-x-auto px-12 pt-0.5 pb-2 scrollbar-hide sm:gap-6 sm:px-14';

const scrollButtonClass =
  'absolute top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/90 p-2.5 text-gray-800 shadow-lg transition-transform hover:scale-110 sm:p-3 md:flex';

const scrollToActorIndex = (container, index) => {
  const card = container?.children[index];
  if (!container || !card) return;

  container.scrollTo({
    left: card.offsetLeft - container.offsetLeft,
    behavior: 'smooth',
  });
};

const getAnchorIndex = (container) => {
  const cards = Array.from(container.children);
  if (!cards.length) return 0;

  const containerRect = container.getBoundingClientRect();

  for (let index = 0; index < cards.length; index += 1) {
    const cardRect = cards[index].getBoundingClientRect();
    if (cardRect.right > containerRect.left + 8) {
      return index;
    }
  }

  return 0;
};

const ActorScrollControls = ({ scrollRef, itemCount, isScrollable, canScrollLeft, canScrollRight }) => {
  const scrollByStep = (direction) => {
    const container = scrollRef.current;
    if (!container) return;

    const anchorIndex = getAnchorIndex(container);
    const targetIndex =
      direction === 'next'
        ? Math.min(anchorIndex + SCROLL_STEP, itemCount - 1)
        : Math.max(anchorIndex - SCROLL_STEP, 0);

    scrollToActorIndex(container, targetIndex);
  };

  if (!isScrollable) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => scrollByStep('prev')}
        disabled={!canScrollLeft}
        aria-label="Scroll actors left"
        className={`${scrollButtonClass} left-0 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <IconChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => scrollByStep('next')}
        disabled={!canScrollRight}
        aria-label="Scroll actors right"
        className={`${scrollButtonClass} right-0 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        <IconChevronRight className="h-5 w-5" />
      </button>
    </>
  );
};

const useActorScrollState = (scrollRef, itemCount) => {
  const [isScrollable, setIsScrollable] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollable = el.scrollWidth > el.clientWidth + 1;
    setIsScrollable(scrollable);
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, [scrollRef]);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return undefined;

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    if (el.firstElementChild) {
      observer.observe(el.firstElementChild);
    }

    el.addEventListener('scroll', updateScrollState, { passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', updateScrollState);
    };
  }, [itemCount, scrollRef, updateScrollState]);

  return { isScrollable, canScrollLeft, canScrollRight };
};

const ActorScrollRow = ({ itemCount, scrollRef, children }) => {
  const { isScrollable, canScrollLeft, canScrollRight } = useActorScrollState(scrollRef, itemCount);

  return (
    <div className={`relative ${PAGE_CONTAINER}`}>
      <ActorScrollControls
        scrollRef={scrollRef}
        itemCount={itemCount}
        isScrollable={isScrollable}
        canScrollLeft={canScrollLeft}
        canScrollRight={canScrollRight}
      />
      <div ref={scrollRef} className={SCROLL_ROW_CLASS}>
        {children}
      </div>
    </div>
  );
};

const ActorRail = ({ actors = [], isLoading = false }) => {
  const scrollRef = useRef(null);

  if (isLoading) {
    return (
      <section className="border-b border-gray-100 bg-white pt-10 pb-2 sm:pt-12 sm:pb-3">
        <ActorScrollRow itemCount={6} scrollRef={scrollRef}>
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="w-[92px] shrink-0 sm:w-[108px]">
              <div className="aspect-square animate-pulse rounded-full border-2 border-gray-200 bg-gray-200" />
              <div className="mx-auto mt-3 h-3 w-16 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </ActorScrollRow>
      </section>
    );
  }

  if (actors.length === 0) return null;

  return (
    <section className="border-b border-gray-100 bg-white pt-10 pb-2 sm:pt-12 sm:pb-3">
      <ActorScrollRow itemCount={actors.length} scrollRef={scrollRef}>
        {actors.map((actor) => (
          <Link
            key={actor.id}
            to={`/videos?actor=${encodeURIComponent(actor.id)}`}
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
        ))}
      </ActorScrollRow>
    </section>
  );
};

export default ActorRail;
