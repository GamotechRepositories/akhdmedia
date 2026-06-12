import { Link } from 'react-router-dom';
import { BRAND } from '../../config/brand';
import { HOME_SECTIONS } from '../../constants/siteContent';
import { PAGE_CONTAINER, SECTION_TITLE } from '../../constants/layout';
import { formatCurrency } from '../../utils/formatters';
import { StoryRailSkeleton } from '../ui/HomeSectionSkeletons';
import OptimizedImage from '../ui/OptimizedImage';
import { IconPlay } from '../icons/Icons';

const StoryRail = ({ stories = [], isLoading = false }) => {
  if (isLoading) return <StoryRailSkeleton />;
  if (stories.length === 0) return null;

  const { title, subtitle, viewAllLink } = HOME_SECTIONS.categoryRail;

  return (
    <section className="border-b border-gray-100 bg-gray-50 py-8 sm:py-10">
      <div className={PAGE_CONTAINER}>
        <div className="mb-5 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 sm:text-xs">
              {BRAND.tagline}
            </p>
            <h2 className={`${SECTION_TITLE} mt-1`}>{title}</h2>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-500 sm:text-base">{subtitle}</p>
            )}
          </div>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className="hidden shrink-0 rounded-full border border-gray-300 bg-gray-900 px-5 py-2 text-sm font-semibold text-white sm:inline-block"
            >
              View All Footage
            </Link>
          )}
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:gap-5 md:mx-0 md:px-0">
          {stories.map((story) => (
            <Link
              key={story.id}
              to={story.link}
              className="group w-[220px] shrink-0 snap-start sm:w-[260px]"
            >
              <div className="relative aspect-video overflow-hidden rounded-xl bg-gray-900 shadow-md ring-1 ring-black/5 transition-shadow group-hover:shadow-lg">
                <OptimizedImage
                  src={story.image}
                  alt={story.label}
                  width={520}
                  height={293}
                  quality={80}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />

                <span className="absolute left-2.5 top-2.5 rounded-md bg-black/75 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white sm:left-3 sm:top-3 sm:text-[10px]">
                  Stock Video
                </span>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100 sm:h-12 sm:w-12">
                    <IconPlay className="ml-0.5 h-5 w-5 text-gray-900" />
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5">
                  <p className="line-clamp-1 text-sm font-bold text-white sm:text-base">
                    {story.label}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-white/80 sm:text-xs">
                    {story.clipCount > 0 ? (
                      <span>{story.clipCount} clips</span>
                    ) : (
                      <span>Browse collection</span>
                    )}
                    {story.minPrice != null && (
                      <>
                        <span className="text-white/40">·</span>
                        <span className="font-semibold text-white">
                          From {formatCurrency(story.minPrice)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-2 line-clamp-1 text-xs font-medium text-gray-600 group-hover:text-gray-900">
                {story.hashtag}
              </p>
            </Link>
          ))}
        </div>

        {viewAllLink && (
          <div className="mt-5 text-center sm:hidden">
            <Link
              to={viewAllLink}
              className="inline-block w-full max-w-xs rounded-full bg-gray-900 px-8 py-3 text-sm font-semibold text-white shadow-lg"
            >
              View All Footage
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default StoryRail;
