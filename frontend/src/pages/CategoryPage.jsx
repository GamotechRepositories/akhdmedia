import { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/catalog/FilterSidebar';
import Pagination from '../components/catalog/Pagination';
import ProductSkeleton from '../components/ui/ProductSkeleton';
import { DEFAULT_CATALOG_FILTERS } from '../constants/catalog';
import { useCatalog } from '../context/CatalogContext';
import {
  CATALOG_PRODUCT_GRID,
  CATALOG_PRODUCT_GRID_EXPANDED,
} from '../constants/layout';
import {
  useCatalogFilters,
  extractCatalogFacets,
  filterByCategory,
} from '../hooks/useCatalogFilters';
import { usePagination } from '../hooks/usePagination';

const CategoryPage = () => {
  const { category, subCategory } = useParams();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search')?.trim() || '';
  const {
    products,
    catalogCategories,
    filterProducts,
    getSubCategoryLabel,
    loading: catalogLoading,
  } = useCatalog();
  const subCategoryLabel = category && subCategory
    ? getSubCategoryLabel(category, subCategory)
    : null;

  const [filters, setFilters] = useState(DEFAULT_CATALOG_FILTERS);
  const [showFilters, setShowFilters] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const pageMeta = useMemo(() => {
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
  }, [category, subCategory, subCategoryLabel, catalogCategories, searchQuery]);

  const baseProducts = useMemo(() => {
    if (searchQuery) {
      return filterProducts({ search: searchQuery });
    }

    return filterByCategory(products, category, subCategory);
  }, [products, category, subCategory, searchQuery, filterProducts]);

  const filteredProducts = useCatalogFilters(baseProducts, filters);
  const { brands, resolutions, fps } = useMemo(
    () => extractCatalogFacets(baseProducts),
    [baseProducts]
  );

  const itemsPerPage = showFilters ? 21 : 28;
  const { paginatedItems, range, page, totalPages, pageNumbers, goToPage } =
    usePagination(filteredProducts, itemsPerPage);

  useEffect(() => {
    setIsLoading(true);
    const timer = window.setTimeout(() => setIsLoading(false), 300);
    return () => window.clearTimeout(timer);
  }, [category, subCategory, filters, catalogLoading, searchQuery]);

  useEffect(() => {
    setFilters(DEFAULT_CATALOG_FILTERS);
  }, [category, subCategory]);

  useEffect(() => {
    if (searchQuery) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchQuery]);

  const toggleFilters = () => {
    if (window.innerWidth >= 1024) {
      setShowFilters((v) => !v);
    } else {
      setShowMobileFilters((v) => !v);
    }
  };

  const gridClass = showFilters ? CATALOG_PRODUCT_GRID : CATALOG_PRODUCT_GRID_EXPANDED;

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500 sm:text-sm">
                {pageMeta.breadcrumbs.map((crumb, index) => (
                  <li key={crumb.label} className="flex items-center gap-2">
                    {index > 0 && <span className="text-gray-400">/</span>}                    {crumb.to ? (
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
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">            {!isLoading && filteredProducts.length > 0 && (
              <p className="whitespace-nowrap text-sm text-gray-500">
                Showing {range.start} - {range.end} of {filteredProducts.length} clips
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
              lg:block
              w-full lg:w-1/4 lg:flex-shrink-0
              lg:transition-transform lg:duration-500 lg:ease-[cubic-bezier(0.25,0.1,0.25,1)]
              ${showFilters
                ? 'lg:translate-x-0 lg:pointer-events-auto'
                : 'lg:-translate-x-full lg:pointer-events-none lg:absolute lg:left-0 lg:overflow-hidden'}
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
                setFilters(next);
                if (window.innerWidth < 1024) setShowMobileFilters(false);
              }}
              onClearFilters={() => setFilters(DEFAULT_CATALOG_FILTERS)}
            />
          </div>

          <div className={`flex-1 transition-all duration-500 ${showFilters ? '' : 'lg:-translate-y-2'}`}>
            {isLoading ? (
              <div className={gridClass}>
                {Array.from({ length: 8 }, (_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : paginatedItems.length > 0 ? (
              <>
                <div className={gridClass}>
                  {paginatedItems.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  pageNumbers={pageNumbers}
                  onPageChange={goToPage}
                />
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="mb-4 text-lg text-gray-600">
                  {searchQuery
                    ? `No clips found for "${searchQuery}".`
                    : 'No clips match your filters.'}
                </p>
                {searchQuery ? (
                  <Link
                    to="/videos"
                    className="font-medium text-gray-900 underline underline-offset-4"
                  >
                    Browse all videos
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setFilters(DEFAULT_CATALOG_FILTERS)}
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
