import { IconChevronRight } from '../icons/Icons';
import {
  resolveCtaTypography,
  resolveHeadlineTypography,
  resolveOverlayPositions,
} from '../../constants/heroTypography';

const ctaClassName =
  'inline-flex w-max max-w-none shrink-0 items-center gap-[0.35em] whitespace-nowrap rounded-full bg-white uppercase tracking-wider text-gray-900 shadow-lg';

const HeroSlideOverlay = ({ slide, compact = false, device = 'desktop', showChevron = true }) => {
  const hasHeadline = Boolean(slide.headline?.trim());
  const hasButton = Boolean(slide.cta?.trim());
  const resolvedDevice = device || (compact ? 'mobile' : 'desktop');
  const { headline: headlinePosition, cta: ctaPosition, stacked } = resolveOverlayPositions(slide, {
    compact,
    device: resolvedDevice,
  });
  const headlineStyle = resolveHeadlineTypography(slide, {
    compact,
    device: resolvedDevice,
  });
  const ctaStyle = resolveCtaTypography(slide, { compact, device: resolvedDevice });
  const ctaOffsetX = Math.max(0, ctaPosition.x - headlinePosition.x);

  if (!hasHeadline && !hasButton) return null;

  if (stacked) {
    return (
      <div
        className="pointer-events-none absolute flex max-w-[88%] flex-col items-start gap-[0.55em]"
        style={{
          left: `${headlinePosition.x}%`,
          top: `${headlinePosition.y}%`,
        }}
      >
        <h2 className="m-0 p-0 text-white drop-shadow-lg" style={headlineStyle}>
          {slide.headline}
        </h2>
        <span
          className={ctaClassName}
          style={{
            ...ctaStyle,
            marginLeft: ctaOffsetX > 0 ? `${ctaOffsetX}%` : undefined,
          }}
        >
          {slide.cta}
          {showChevron ? (
            <IconChevronRight className="h-[1em] w-[1em] shrink-0" aria-hidden />
          ) : null}
        </span>
      </div>
    );
  }

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
