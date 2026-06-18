import { Link } from 'react-router-dom';
import { PAGE_CONTAINER } from '../../constants/layout';
import OptimizedImage from '../ui/OptimizedImage';

const ActorRail = ({ actors = [], isLoading = false }) => {
  if (isLoading) {
    return (
      <section className="border-b border-gray-100 bg-white pt-6 pb-2 sm:pt-8 sm:pb-3">
        <div className={PAGE_CONTAINER}>
          <div className="-mx-4 flex gap-4 overflow-hidden px-4 sm:gap-6 md:mx-0 md:px-0">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="w-[92px] shrink-0 sm:w-[108px]">
                <div className="aspect-square animate-pulse rounded-full bg-gray-200" />
                <div className="mx-auto mt-3 h-3 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (actors.length === 0) return null;

  return (
    <section className="border-b border-gray-100 bg-white pt-6 pb-2 sm:pt-8 sm:pb-3">
      <div className={PAGE_CONTAINER}>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:gap-6 md:mx-0 md:px-0">
          {actors.map((actor) => (
              <Link
                key={actor.id}
                to={`/videos?actor=${encodeURIComponent(actor.id)}`}
                className="group w-[92px] shrink-0 snap-start text-center sm:w-[108px]"
              >
                <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-200 transition group-hover:ring-gray-900">
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
        </div>
      </div>
    </section>
  );
};

export default ActorRail;
