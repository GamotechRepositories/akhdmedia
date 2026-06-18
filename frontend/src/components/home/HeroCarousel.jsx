import { useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext';
import { HeroSkeleton } from '../ui/HomeSectionSkeletons';
import OptimizedImage from '../ui/OptimizedImage';
import { useCarousel } from '../../hooks/useCarousel';
import { useInView } from '../../hooks/useInView';
import { IconChevronLeft, IconChevronRight } from '../icons/Icons';

const HeroSlide = ({ slide, isActive, compact = false, motionEnabled = true }) => {
  const hasButton = Boolean(slide.cta?.trim());
  const hasOverlay = Boolean(slide.badge?.trim() || slide.headline?.trim() || hasButton);
  const slideClassName = `absolute inset-0 transition-opacity duration-700 ease-in-out ${
    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
  }`;

  const content = (
    <>
      <OptimizedImage
        src={slide.image}
        alt=""
        width={compact ? 900 : 1400}
        height={compact ? 675 : 560}
        quality={80}
        loading={isActive ? 'eager' : 'lazy'}
        fetchPriority={isActive ? 'high' : undefined}
        className={`absolute inset-0 h-full w-full object-cover ${
          isActive && motionEnabled ? 'scale-105 hero-kenburns' : 'scale-100'
        }`}
      />
      {slide.showShadow ? (
        <>
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.accent}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        </>
      ) : null}

      <div className={`relative z-10 flex h-full items-end sm:items-center ${compact ? 'px-5 pb-8 pt-16' : 'px-5 sm:px-10 lg:px-20'}`}>
        {hasOverlay ? (
          <div className="max-w-2xl text-white">
            {slide.badge ? (
              <span className="mb-2 inline-flex items-center rounded-full border border-white/20 bg-black/40 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] sm:mb-4 sm:px-3 sm:py-1 sm:text-[10px]">
                {slide.badge}
              </span>
            ) : null}
            {slide.headline ? (
              <h2 className={`font-black leading-tight tracking-tight ${compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-4xl lg:text-5xl'}`}>
                {slide.headline}
              </h2>
            ) : null}
            {hasButton ? (
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-900 sm:mt-6 sm:px-5 sm:py-2.5 sm:text-xs">
                {slide.cta}
                <IconChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );

  if (hasButton && slide.link) {
    return (
      <Link
        to={slide.link}
        aria-hidden={!isActive}
        tabIndex={isActive ? 0 : -1}
        className={slideClassName}
      >
        {content}
      </Link>
    );
  }

  return (
    <div aria-hidden={!isActive} className={slideClassName}>
      {content}
    </div>
  );
};

const CarouselControls = ({ heroSlides, activeIndex, prev, next, goTo, compact = false }) => (
  <>
    {heroSlides.length > 1 && !compact && (
      <>
        <button
          type="button"
          onClick={prev}
          aria-label="Previous slide"
          className="absolute top-1/2 left-3 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-gray-800 opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:scale-110 sm:left-4 sm:p-3"
        >
          <IconChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next slide"
          className="absolute top-1/2 right-3 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-gray-800 opacity-0 shadow-lg transition-all group-hover:opacity-100 hover:scale-110 sm:right-4 sm:p-3"
        >
          <IconChevronRight className="h-5 w-5" />
        </button>
      </>
    )}

    <div className={`absolute left-1/2 z-20 flex -translate-x-1/2 gap-1.5 sm:gap-2 ${compact ? 'bottom-3' : 'bottom-4 sm:bottom-5'}`}>
      {heroSlides.map((slide, index) => (
        <button
          key={slide.id}
          type="button"
          aria-label={`Go to slide ${index + 1}`}
          onClick={() => goTo(index)}
          className={`rounded-full transition-all duration-300 ${
            index === activeIndex ? 'w-6 bg-white sm:w-8' : 'w-1.5 bg-white/40 hover:bg-white/70 sm:w-2'
          } h-1.5 sm:h-1.5`}
        />
      ))}
    </div>
  </>
);

const SWIPE_THRESHOLD = 50;

const mapSettingsHeroSlides = (slides = []) =>
  slides
    .filter((slide) => slide.isActive !== false && slide.image?.trim())
    .map((slide, index) => ({
      id: `hero-settings-${index}`,
      link: slide.link || '',
      badge: slide.badge || '',
      headline: slide.headline || '',
      cta: slide.cta || '',
      image: slide.image,
      accent: slide.accent || 'from-gray-900/80 via-black/50 to-transparent',
      showShadow: slide.showShadow === true,
    }));

const HeroCarousel = () => {
  const { siteContent, loading } = useCatalog();
  const heroSlides = useMemo(
    () => mapSettingsHeroSlides(siteContent?.heroSlides || []),
    [siteContent?.heroSlides],
  );
  const { activeIndex, next, prev, goTo, pause, resume } = useCarousel(heroSlides.length);
  const { ref, isInView } = useInView();
  const motionEnabled = isInView;
  const touchStart = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e) => {
    pause();
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };

  const handleTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) next();
      else prev();
    }

    resume();
  };

  if (loading || heroSlides.length === 0) {
    return <HeroSkeleton />;
  }

  return (
    <section
      ref={ref}
      className="group relative w-full overflow-hidden bg-gray-950"
      onMouseEnter={pause}
      onMouseLeave={resume}
      aria-label="Featured collections"
    >
      {/* Mobile & tablet carousel — swipe to change slide */}
      <div
        className="relative mx-auto aspect-[4/3] w-full max-w-[2000px] touch-pan-y sm:aspect-[16/10] md:hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {heroSlides.map((slide, index) => (
          <HeroSlide
            key={slide.id}
            slide={slide}
            isActive={index === activeIndex}
            compact
            motionEnabled={motionEnabled}
          />
        ))}
        <CarouselControls
          heroSlides={heroSlides}
          activeIndex={activeIndex}
          prev={prev}
          next={next}
          goTo={goTo}
          compact
        />
      </div>

      {/* Desktop carousel */}
      <div className="relative mx-auto hidden aspect-[21/9] w-full max-w-[2000px] md:block lg:aspect-[3/1]">
        {heroSlides.map((slide, index) => (
          <HeroSlide
            key={slide.id}
            slide={slide}
            isActive={index === activeIndex}
            motionEnabled={motionEnabled}
          />
        ))}
        <CarouselControls
          heroSlides={heroSlides}
          activeIndex={activeIndex}
          prev={prev}
          next={next}
          goTo={goTo}
        />
      </div>
    </section>
  );
};

export default HeroCarousel;
