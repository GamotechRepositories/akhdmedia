import { Link } from 'react-router-dom';
import ActorCard from '../actors/ActorCard';
import { PAGE_CONTAINER } from '../../constants/layout';

const ActorRail = ({
  actors = [],
  isLoading = false,
  viewAllLink = '/actors',
}) => {
  if (!isLoading && actors.length === 0) return null;

  return (
    <section className="border-b border-gray-100 bg-white pt-4 pb-2 sm:pt-5 sm:pb-3">
      <div className={PAGE_CONTAINER}>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide sm:gap-6">
          {isLoading
            ? Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="w-[92px] shrink-0 sm:w-[108px]">
                  <div className="aspect-square animate-pulse rounded-full border-2 border-gray-200 bg-gray-200" />
                  <div className="mx-auto mt-3 h-3 w-16 animate-pulse rounded bg-gray-200" />
                </div>
              ))
            : actors.map((actor) => (
                <ActorCard
                  key={actor.id}
                  actor={actor}
                  className="w-[92px] shrink-0 sm:w-[108px]"
                />
              ))}
        </div>

        {viewAllLink && (
          <div className="mt-2 flex justify-end">
            <Link
              to={viewAllLink}
              className="shrink-0 rounded-full border border-gray-300 bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white sm:px-5 sm:py-2 sm:text-sm"
            >
              View All
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default ActorRail;
