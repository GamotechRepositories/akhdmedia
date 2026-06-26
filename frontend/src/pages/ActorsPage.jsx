import { useMemo, useState } from 'react';
import ActorCard from '../components/actors/ActorCard';
import { PAGE_CONTAINER } from '../constants/layout';
import { useCatalog } from '../context/CatalogContext';
import { filterActorsBySearch } from '../utils/actorSearch';

const searchBoxClass =
  'flex w-full items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-gray-300 focus-within:shadow';

const ActorsPage = () => {
  const { actors, loading } = useCatalog();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredActors = useMemo(
    () => filterActorsBySearch(actors, searchQuery),
    [actors, searchQuery],
  );

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className={PAGE_CONTAINER}>
        {!loading && actors.length > 0 ? (
          <div className="mx-auto mb-6 w-full max-w-md">
            <label htmlFor="actor-search" className="sr-only">
              Search actors by name
            </label>
            <div className={searchBoxClass}>
              <svg
                className="h-4 w-4 shrink-0 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                id="actor-search"
                type="search"
                role="searchbox"
                enterKeyHint="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search actors by name..."
                className="min-w-0 flex-1 border-none bg-transparent py-0.5 text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="rounded-full p-0.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

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
          filteredActors.length > 0 ? (
            <div className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {filteredActors.map((actor) => (
                <ActorCard key={actor.id} actor={actor} />
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-gray-500 sm:text-base">
              No actors found for &ldquo;{searchQuery.trim()}&rdquo;.
            </p>
          )
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
