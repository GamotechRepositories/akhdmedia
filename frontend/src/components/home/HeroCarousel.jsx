import { useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext';
import { HeroSkeleton } from '../ui/HomeSectionSkeletons';
import OptimizedImage from '../ui/OptimizedImage';
import { useCarousel } from '../../hooks/useCarousel';
import { useInView } from '../../hooks/useInView';
import { IconChevronLeft, IconChevronRight } from '../icons/Icons';
import {
  HERO_BANNER_DESKTOP_RATIO,
  HERO_BANNER_MOBILE_RATIO,
  HERO_BANNER_TABLET_RATIO,
  resolveImageFocus,
} from '../../constants/heroBanner';
import HeroSlideOverlay from './HeroSlideOverlay';
import {
  DEFAULT_CTA_POSITION,
  DEFAULT_HEADLINE_POSITION,
} from '../../constants/heroTypography';

const HeroSlide = ({ slide, isActive, compact = false, device = 'desktop', motionEnabled = true }) => {
  const hasLink = Boolean(slide.link?.trim());
  const hasOverlay = Boolean(slide.headline?.trim() || slide.cta?.trim());
  const imageFocus = resolveImageFocus(slide.imageFocus, device);
  const slideClassName = `absolute inset-0 transition-opacity duration-700 ease-in-out ${
    isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
  }`;

  const imageLayer = (
    <>
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${imageFocus.scale})`,
            transformOrigin: `${imageFocus.x}% ${imageFocus.y}%`,
          }}
        >
          <OptimizedImage
            src={slide.image}
            alt=""
            width={compact ? 900 : device === 'tablet' ? 1200 : 1400}
            height={compact ? 675 : device === 'tablet' ? 750 : 560}
            quality={80}
            loading={isActive ? 'eager' : 'lazy'}
            fetchPriority={isActive ? 'high' : undefined}
            style={{ objectPosition: `${imageFocus.x}% ${imageFocus.y}%` }}
            className={`absolute inset-0 h-full w-full object-cover ${
              isActive && motionEnabled ? 'hero-kenburns' : ''
            }`}
          />
        </div>
      </div>
      {slide.showShadow ? (
        <>
          <div className={`absolute inset-0 bg-gradient-to-r ${slide.accent}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        </>
      ) : null}
    </>
  );

  const overlayLayer = hasOverlay ? (
    <div className="pointer-events-none absolute inset-0 z-10">
      <HeroSlideOverlay slide={slide} compact={compact} />
    </div>
  ) : null;

  if (hasLink) {
    return (
      <div aria-hidden={!isActive} className={slideClassName}>
        <Link
          to={slide.link}
          aria-label={slide.headline?.trim() || slide.cta?.trim() || 'View category'}
          aria-hidden={!isActive}
          tabIndex={isActive ? 0 : -1}
          className="absolute inset-0 z-0 block"
        >
          {imageLayer}
        </Link>
        {overlayLayer}
      </div>
    );
  }

  return (
    <div aria-hidden={!isActive} className={slideClassName}>
      {imageLayer}
      {overlayLayer}
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
          className="absolute top-1/2 left-3 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-gray-800 shadow-lg transition-transform hover:scale-110 sm:left-4 sm:p-3"
        >
          <IconChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next slide"
          className="absolute top-1/2 right-3 z-20 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-gray-800 shadow-lg transition-transform hover:scale-110 sm:right-4 sm:p-3"
        >
          <IconChevronRight className="h-5 w-5" />
        </button>
      </>
    )}

    <div
      className={`absolute left-1/2 z-20 flex -translate-x-1/2 gap-1.5 sm:gap-2 ${
        compact ? 'bottom-3' : 'bottom-4 sm:bottom-5'
      }`}
    >
      {heroSlides.map((slide, index) => (
        <button
          key={slide.id}
          type="button"
          aria-label={`Go to slide ${index + 1}`}
          onClick={() => goTo(index)}
          className={`rounded-full transition-all duration-300 ${
            index === activeIndex
              ? 'w-6 bg-white sm:w-8'
              : 'w-1.5 bg-white/40 hover:bg-white/70 sm:w-2'
          } h-1.5 sm:h-1.5`}
        />
      ))}
    </div>
  </>
);

const SWIPE_THRESHOLD = 50;
const BANNER_AUTO_INTERVAL_MS = 4000;

const mapSettingsHeroSlides = (slides = []) =>
  slides
    .filter((slide) => slide.isActive !== false && slide.image?.trim())
    .map((slide, index) => ({
      id: `hero-settings-${index}`,
      link: slide.link || '',
      headline: slide.headline || '',
      cta: slide.cta || '',
      image: slide.image,
      accent: slide.accent || 'from-gray-900/80 via-black/50 to-transparent',
      showShadow: slide.showShadow === true,
      headlinePosition: slide.headlinePosition || DEFAULT_HEADLINE_POSITION,
      ctaPosition: slide.ctaPosition || DEFAULT_CTA_POSITION,
      imageFocus: slide.imageFocus || {},
      headlineFontSize: slide.headlineFontSize,
      headlineFontFamily: slide.headlineFontFamily,
      ctaScale: slide.ctaScale,
      ctaFontFamily: slide.ctaFontFamily,
    }));

const HeroCarousel = () => {
  const { siteContent, loading } = useCatalog();
  const heroSlides = useMemo(
    () => mapSettingsHeroSlides(siteContent?.heroSlides || []),
    [siteContent?.heroSlides],
  );
  const { activeIndex, next, prev, goTo, pause, resume } = useCarousel(
    heroSlides.length,
    BANNER_AUTO_INTERVAL_MS,
  );
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
      {/* Mobile — phones */}
      <div
        className="relative mx-auto w-full max-w-[2000px] touch-pan-y [container-type:size] md:hidden"
        style={{ aspectRatio: HERO_BANNER_MOBILE_RATIO }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {heroSlides.map((slide, index) => (
          <HeroSlide
            key={slide.id}
            slide={slide}
            isActive={index === activeIndex}
            compact
            device="mobile"
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

      {/* iPad / tablet */}
      <div
        className="relative mx-auto hidden w-full max-w-[2000px] touch-pan-y [container-type:size] md:block lg:hidden"
        style={{ aspectRatio: HERO_BANNER_TABLET_RATIO }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {heroSlides.map((slide, index) => (
          <HeroSlide
            key={`tablet-${slide.id}`}
            slide={slide}
            isActive={index === activeIndex}
            device="tablet"
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

      {/* Desktop */}
      <div
        className="relative mx-auto hidden w-full max-w-[2000px] [container-type:size] lg:block"
        style={{ aspectRatio: HERO_BANNER_DESKTOP_RATIO }}
      >
        {heroSlides.map((slide, index) => (
          <HeroSlide
            key={`desktop-${slide.id}`}
            slide={slide}
            isActive={index === activeIndex}
            device="desktop"
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
