import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/catalog/FilterSidebar';
import ProductSkeleton from '../components/ui/ProductSkeleton';
import InfiniteScrollSentinel from '../components/ui/InfiniteScrollSentinel';
import { DEFAULT_CATALOG_FILTERS } from '../constants/catalog';
import { useCatalog } from '../context/CatalogContext';
import {
  CATALOG_PRODUCT_GRID,
  CATALOG_PRODUCT_GRID_EXPANDED,
} from '../constants/layout';
import {
  applyCatalogFiltersToSearchParams,
  clearCatalogFilterParams,
  parseCatalogFiltersFromSearchParams,
} from '../utils/catalogFilterParams';
import { extractCatalogFacets } from '../hooks/useCatalogFilters';
import { useInfiniteProducts } from '../hooks/useInfiniteProducts';

const CategoryPage = () => {
  const { category, subCategory } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search')?.trim() || '';
  const actorId = searchParams.get('actor')?.trim() || '';
  const {
    actors,
    catalogCategories,
    getSubCategoryLabel,
    rememberProducts,
  } = useCatalog();
  const subCategoryLabel = category && subCategory
    ? getSubCategoryLabel(category, subCategory)
    : null;

  const filters = useMemo(
    () => parseCatalogFiltersFromSearchParams(searchParams),
    [searchParams],
  );

  const updateFilters = useCallback(
    (nextFilters) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          applyCatalogFiltersToSearchParams(params, nextFilters);
          params.delete('page');
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const clearFilters = useCallback(() => {
    updateFilters(DEFAULT_CATALOG_FILTERS);
  }, [updateFilters]);

  const [showFilters, setShowFilters] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const selectedActor = useMemo(
    () => actors.find((actor) => actor.id === actorId) || null,
    [actors, actorId],
  );

  const pageMeta = useMemo(() => {
    if (selectedActor) {
      return {
        title: `${selectedActor.name} Footage`,
        breadcrumbs: [
          { label: 'Home', to: '/' },
          { label: 'Actors', to: '/actors' },
          { label: selectedActor.name, to: null },
        ],
      };
    }

    if (searchQuery) {
      return {
        title: `Search results for "${searchQuery}"`,
        breadcrumbs: [
          { label: 'Home', to: '/' },
          { label: 'Videos', to: '/videos' },
          { label: 'Search', to: null },
        ],
      };
    }

    if (category && catalogCategories[category]) {
      const meta = catalogCategories[category];
      const breadcrumbs = [
        { label: 'Home', to: '/' },
        { label: 'Videos', to: '/videos' },
        { label: meta.breadcrumb, to: subCategory ? `/videos/${category}` : null },
      ];

      if (subCategoryLabel) {
        breadcrumbs.push({ label: subCategoryLabel, to: null });
      }

      return {
        title: subCategoryLabel ? `${subCategoryLabel}` : meta.label,
        breadcrumbs,
      };
    }

    return {
      title: 'All Videos',
      breadcrumbs: [
        { label: 'Home', to: '/' },
        { label: 'Videos', to: null },
      ],
    };
  }, [category, subCategory, subCategoryLabel, catalogCategories, searchQuery, selectedActor]);

  const productQuery = useMemo(() => {
    const query = {
      sortBy: filters.sortBy,
    };

    if (category) query.categorySlug = category;
    if (subCategory) query.subCategorySlug = subCategory;
    if (actorId) query.actorId = actorId;
    if (searchQuery) query.search = searchQuery;
    if (filters.brands?.length) query.brands = filters.brands.join(',');
    if (filters.resolutions?.length) query.resolutions = filters.resolutions.join(',');
    if (filters.fps?.length) query.fps = filters.fps.join(',');
    if (filters.priceRange?.min != null) query.priceMin = filters.priceRange.min;
    if (filters.priceRange?.max != null) query.priceMax = filters.priceRange.max;

    return query;
  }, [actorId, category, filters, searchQuery, subCategory]);

  const {
    products,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    reload,
  } = useInfiniteProducts({ params: productQuery });

  useEffect(() => {
    rememberProducts(products);
  }, [products, rememberProducts]);

  const { brands, resolutions, fps } = useMemo(
    () => extractCatalogFacets(products),
    [products],
  );

  const listingScope = `${category || ''}|${subCategory || ''}|${actorId || ''}`;
  const prevListingScopeRef = useRef(listingScope);

  useEffect(() => {
    if (prevListingScopeRef.current === listingScope) return;
    prevListingScopeRef.current = listingScope;
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        clearCatalogFilterParams(params);
        return params;
      },
      { replace: true },
    );
  }, [listingScope, setSearchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [category, subCategory, searchQuery, actorId, filters]);

  const toggleFilters = () => {
    if (window.innerWidth >= 1024) {
      setShowFilters((value) => !value);
    } else {
      setShowMobileFilters((value) => !value);
    }
  };

  const gridClass = showFilters ? CATALOG_PRODUCT_GRID : CATALOG_PRODUCT_GRID_EXPANDED;
  const range = products.length
    ? { start: 1, end: products.length }
    : { start: 0, end: 0 };

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 sm:text-sm">
                {pageMeta.breadcrumbs.map((crumb, index) => (
                  <li key={crumb.label} className="flex items-center gap-2">
                    {index > 0 && <span className="text-gray-400">/</span>}
                    {crumb.to ? (
                      <Link to={crumb.to} className="transition hover:text-gray-900">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-gray-900">{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>

            <h1 className="mt-2 text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">{pageMeta.title}</h1>
            {selectedActor && (
              <div className="mt-3 flex items-center gap-3">
                {selectedActor.image ? (
                  <img
                    src={selectedActor.image}
                    alt={selectedActor.name}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-gray-200"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600">
                    {selectedActor.name?.charAt(0) || '?'}
                  </div>
                )}
                <p className="text-sm text-gray-600">
                  Clips featuring <span className="font-semibold text-gray-900">{selectedActor.name}</span>
                </p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
            {!loading && total > 0 && (
              <p className="whitespace-nowrap text-sm text-gray-500">
                Showing {range.start} - {range.end} of {total} clips
              </p>
            )}

            <button
              type="button"
              onClick={toggleFilters}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="hidden lg:inline">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
              <span className="lg:hidden">Filters</span>
            </button>
          </div>
        </div>

        <div className="relative flex gap-6">
          <div
            className={`
              ${showMobileFilters ? 'block' : 'hidden'}
              ${showFilters ? 'lg:block' : 'lg:hidden'}
              w-full lg:w-1/4 lg:flex-shrink-0
              ${showMobileFilters
                ? 'fixed inset-0 z-50 overflow-y-auto bg-white p-4 pb-28 lg:relative lg:z-auto lg:bg-transparent lg:p-0 lg:overflow-visible'
                : ''}
            `}
          >
            {showMobileFilters && (
              <div className="mb-4 flex items-center justify-between lg:hidden">
                <h2 className="text-xl font-bold">Filters</h2>
                <button type="button" onClick={() => setShowMobileFilters(false)} aria-label="Close filters">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <FilterSidebar
              filters={filters}
              brands={brands}
              resolutions={resolutions}
              fpsOptions={fps}
              onFilterChange={(next) => {
                updateFilters(next);
                if (window.innerWidth < 1024) setShowMobileFilters(false);
              }}
              onClearFilters={clearFilters}
            />
          </div>

          <div className="min-w-0 flex-1 transition-all duration-300">
            {loading ? (
              <div className={gridClass}>
                {Array.from({ length: 8 }, (_, index) => (
                  <ProductSkeleton key={index} />
                ))}
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <p className="mb-4 text-lg text-gray-600">{error}</p>
                <button
                  type="button"
                  onClick={reload}
                  className="font-medium text-gray-900 underline underline-offset-4"
                >
                  Try again
                </button>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className={gridClass}>
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {loadingMore ? (
                  <div className={`mt-6 ${gridClass}`}>
                    {Array.from({ length: 4 }, (_, index) => (
                      <ProductSkeleton key={`more-${index}`} />
                    ))}
                  </div>
                ) : null}

                <InfiniteScrollSentinel
                  disabled={!hasMore || loadingMore}
                  onVisible={loadMore}
                />

                {!hasMore && products.length > 0 ? (
                  <p className="mt-8 text-center text-sm text-gray-500">You&apos;ve reached the end.</p>
                ) : null}
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="mb-4 text-lg text-gray-600">
                  {selectedActor
                    ? `No clips found for ${selectedActor.name}.`
                    : searchQuery
                      ? `No clips found for "${searchQuery}".`
                      : 'No clips match your filters.'}
                </p>
                {selectedActor || searchQuery ? (
                  <Link
                    to="/videos"
                    className="font-medium text-gray-900 underline underline-offset-4"
                  >
                    Browse all videos
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="font-medium text-gray-900 underline underline-offset-4"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
