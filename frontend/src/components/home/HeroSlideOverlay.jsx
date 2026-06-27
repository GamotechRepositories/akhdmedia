import { IconChevronRight } from '../icons/Icons';
import {
  DEFAULT_CTA_POSITION,
  DEFAULT_HEADLINE_POSITION,
  resolveCtaTypography,
  resolveHeadlineTypography,
  resolveOverlayPosition,
} from '../../constants/heroTypography';

const ctaClassName =
  'inline-flex w-max max-w-none shrink-0 items-center gap-[0.35em] whitespace-nowrap rounded-full bg-white uppercase tracking-wider text-gray-900 shadow-lg';

const HeroSlideOverlay = ({ slide, compact = false, showChevron = true }) => {
  const hasHeadline = Boolean(slide.headline?.trim());
  const hasButton = Boolean(slide.cta?.trim());
  const headlinePosition = resolveOverlayPosition(
    slide.headlinePosition,
    DEFAULT_HEADLINE_POSITION,
  );
  const ctaPosition = resolveOverlayPosition(slide.ctaPosition, DEFAULT_CTA_POSITION);
  const headlineStyle = resolveHeadlineTypography(slide, { compact });
  const ctaStyle = resolveCtaTypography(slide, { compact });

  if (!hasHeadline && !hasButton) return null;

  return (
    <>
      {hasHeadline ? (
        <div
          className="pointer-events-none absolute max-w-[70%]"
          style={{
            left: `${headlinePosition.x}%`,
            top: `${headlinePosition.y}%`,
          }}
        >
          <h2 className="m-0 p-0 text-white drop-shadow-lg" style={headlineStyle}>
            {slide.headline}
          </h2>
        </div>
      ) : null}
      {hasButton ? (
        <div
          className="pointer-events-none absolute max-w-none"
          style={{
            left: `${ctaPosition.x}%`,
            top: `${ctaPosition.y}%`,
          }}
        >
          <span className={ctaClassName} style={ctaStyle}>
            {slide.cta}
            {showChevron ? (
              <IconChevronRight className="h-[1em] w-[1em] shrink-0" aria-hidden />
            ) : null}
          </span>
        </div>
      ) : null}
    </>
  );
};

export default HeroSlideOverlay;
