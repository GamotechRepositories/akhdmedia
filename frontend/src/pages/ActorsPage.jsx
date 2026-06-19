import { Link } from 'react-router-dom';
import ActorCard from '../components/actors/ActorCard';
import { PAGE_CONTAINER } from '../constants/layout';
import { useCatalog } from '../context/CatalogContext';

const ActorsPage = () => {
  const { actors, loading } = useCatalog();

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className={PAGE_CONTAINER}>
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 sm:text-sm">
            <li>
              <Link to="/" className="transition hover:text-gray-900">
                Home
              </Link>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-gray-400">/</span>
              <span className="text-gray-900">Actors</span>
            </li>
          </ol>
        </nav>

        {loading ? (
          <div className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {Array.from({ length: 12 }, (_, index) => (
              <div key={index}>
                <div className="aspect-square animate-pulse rounded-full border-2 border-gray-200 bg-gray-200" />
                <div className="mx-auto mt-3 h-3 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : actors.length > 0 ? (
          <div className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {actors.map((actor) => (
              <ActorCard key={actor.id} actor={actor} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-gray-500 sm:text-base">
            No actors available right now.
          </p>
        )}
      </div>
    </div>
  );
};

export default ActorsPage;
