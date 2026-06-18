import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext';
import { mapCategoryPanels } from '../../utils/categoryContent';
import { CategoryAccordionSkeleton } from '../ui/HomeSectionSkeletons';
import OptimizedImage from '../ui/OptimizedImage';

const AUTO_SCROLL_MS = 4000;
const MOBILE_CARD_CLASS = 'aspect-[4/5] w-[44vw] max-w-[155px]';
const DESKTOP_VISIBLE_CARDS = 5;
const DESKTOP_AUTO_SCROLL_STEP = 2;

const getDesktopCardClass = (panelCount) =>
  panelCount > DESKTOP_VISIBLE_CARDS
    ? 'w-[calc((100%-2rem)/5)] shrink-0'
    : 'min-w-0 flex-1 hover:flex-[3]';

const scrollContainerToIndex = (container, index) => {
  const card = container?.children[index];
  if (!card) return;

  container.scrollTo({
    left: card.offsetLeft - container.offsetLeft,
    behavior: 'smooth',
  });
};

const CategoryAccordion = () => {
  const { categories, loading } = useCatalog();
  const panels = mapCategoryPanels(categories);
  const scrollRef = useRef(null);
  const desktopScrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const resumeTimerRef = useRef(null);

  const scrollToIndex = useCallback((index) => {
    scrollContainerToIndex(scrollRef.current, index);
    setActiveIndex(index);
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
    if (panels.length <= 1 || isPaused) return undefined;

    const timer = window.setInterval(() => {
      const isDesktop = window.matchMedia('(min-width: 768px)').matches;
      const useDesktopScroll = isDesktop && panels.length > DESKTOP_VISIBLE_CARDS;
      const container = useDesktopScroll ? desktopScrollRef.current : scrollRef.current;
      const step = useDesktopScroll ? DESKTOP_AUTO_SCROLL_STEP : 1;

      if (!container) return;

      setActiveIndex((current) => {
        const next = current + step >= panels.length ? 0 : current + step;
        scrollContainerToIndex(container, next);
        return next;
      });
    }, AUTO_SCROLL_MS);

    return () => window.clearInterval(timer);
  }, [panels.length, isPaused]);

  const pauseAutoScroll = () => {
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }
    setIsPaused(true);
  };

  const resumeAutoScrollLater = () => {
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => setIsPaused(false), 3500);
  };

  if (loading) return <CategoryAccordionSkeleton />;
  if (panels.length === 0) return null;

  return (
    <section className="scroll-section bg-white pt-2 pb-0 sm:pt-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-3 text-center sm:mb-5">
          <h2 className="text-xl font-bold text-gray-600 sm:text-3xl">
            Browse by Footage Type
          </h2>
        </div>

        <div className="md:hidden">
          <div
            ref={scrollRef}
            className="-mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-3 scrollbar-hide"
            onTouchStart={pauseAutoScroll}
            onTouchEnd={resumeAutoScrollLater}
            onMouseEnter={pauseAutoScroll}
            onMouseLeave={resumeAutoScrollLater}
          >
            {panels.map((category, index) => (
              <Link
                key={category.id}
                to={`/videos/${category.id}`}
                className={`group relative shrink-0 snap-start overflow-hidden rounded-lg ${MOBILE_CARD_CLASS}`}
              >
                <OptimizedImage
                  src={category.image}
                  alt={category.label}
                  width={310}
                  height={388}
                  quality={75}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-0 p-2.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-wide text-white">
                    {category.label}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          {panels.length > 1 && (
            <div className="flex justify-center gap-1.5 pt-1">
              {panels.map((panel, index) => (
                <button
                  key={panel.id}
                  type="button"
                  aria-label={`Go to ${panel.label}`}
                  onClick={() => scrollToIndex(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === activeIndex ? 'w-5 bg-gray-900' : 'w-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div
          ref={desktopScrollRef}
          className={`hidden h-[320px] gap-2 md:flex lg:h-[400px] ${
            panels.length > DESKTOP_VISIBLE_CARDS
              ? 'overflow-x-auto pb-2 scrollbar-hide'
              : 'w-full'
          }`}
          onMouseEnter={pauseAutoScroll}
          onMouseLeave={resumeAutoScrollLater}
        >
          {panels.map((category) => (
            <Link
              key={category.id}
              to={`/videos/${category.id}`}
              className={`group relative cursor-pointer overflow-hidden rounded-lg transition-all duration-500 ease-out ${getDesktopCardClass(panels.length)}`}
            >
              <OptimizedImage
                src={category.image}
                alt={category.label}
                width={800}
                height={500}
                quality={75}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/25 transition-colors duration-500 group-hover:bg-black/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-90" />

              <div className="absolute bottom-0 flex w-full flex-col items-start justify-end p-4 lg:p-6">
                <h3 className="text-lg font-bold uppercase tracking-widest text-white lg:text-2xl">
                  {category.label}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryAccordion;
