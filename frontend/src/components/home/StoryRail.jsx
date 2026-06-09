import { BRAND } from '../../config/brand';
import { StoryRailSkeleton } from '../ui/HomeSectionSkeletons';
import OptimizedImage from '../ui/OptimizedImage';

const StoryRail = ({ stories = [], onStorySelect, isLoading = false }) => {
  if (isLoading) return <StoryRailSkeleton />;
  if (stories.length === 0) return null;

  return (
    <section className="border-b border-gray-100 bg-white py-6 shadow-sm sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-widest text-gray-500 sm:mb-5 sm:text-base">
          Curated by {BRAND.name}
        </h3>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 scrollbar-hide sm:gap-6 md:mx-0 md:justify-center md:px-0">
          {stories.map((story, index) => (
            <button
              key={story.id}
              type="button"
              onClick={() => onStorySelect(index)}
              className="group flex w-[72px] shrink-0 snap-start flex-col items-center gap-1.5 sm:w-auto sm:gap-2"
            >              <span className="rounded-full bg-gradient-to-tr from-gray-900 to-gray-600 p-[2px] transition-transform group-hover:scale-105">
                <OptimizedImage
                  src={story.image}
                  alt={story.label}
                  width={160}
                  height={160}
                  quality={75}
                  className="h-16 w-16 rounded-full border-2 border-white object-cover sm:h-20 sm:w-20"
                  loading="lazy"
                />
              </span>
              <span className="max-w-[72px] truncate text-[10px] font-semibold text-gray-700 sm:max-w-none sm:text-xs">
                #{story.hashtag}
              </span>            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoryRail;
