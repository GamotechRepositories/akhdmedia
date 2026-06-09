import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext';

export const useProductFilters = () => {
  const { filterProducts, loading } = useCatalog();
  const [searchParams] = useSearchParams();

  const filters = useMemo(
    () => ({
      search: searchParams.get('search') ?? '',
      category: searchParams.get('category') ?? '',
    }),
    [searchParams]
  );

  const products = useMemo(
    () => filterProducts(filters),
    [filterProducts, filters],
  );

  const resultsLabel = useMemo(() => {
    if (filters.search) return `Search results for "${filters.search}"`;
    if (filters.category) {
      return `${filters.category.charAt(0).toUpperCase()}${filters.category.slice(1)} footage`;
    }
    return null;
  }, [filters]);

  return { filters, products, resultsLabel, count: products.length, loading };
};
