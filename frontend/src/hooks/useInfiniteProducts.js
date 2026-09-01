import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchProductsPage } from '../services/catalogApi';

const DEFAULT_PAGE_SIZE = 24;

export const useInfiniteProducts = ({
  params = {},
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
} = {}) => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const paramsKey = useMemo(() => JSON.stringify(params), [params]);
  const hasMore = products.length < total;

  const loadPage = useCallback(
    async (nextPage, { append = false } = {}) => {
      if (!enabled) return;

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      if (append) setLoadingMore(true);
      else setLoading(true);

      setError(null);

      try {
        const response = await fetchProductsPage({
          ...params,
          page: nextPage,
          limit: pageSize,
        });

        if (requestId !== requestIdRef.current) return;

        setTotal(response.pagination.total);
        setPage(nextPage);
        setProducts((current) =>
          append ? [...current, ...response.products] : response.products,
        );
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err.message || 'Failed to load products');
        if (!append) setProducts([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [enabled, pageSize, params],
  );

  useEffect(() => {
    if (!enabled) {
      setProducts([]);
      setTotal(0);
      setPage(1);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    setProducts([]);
    setTotal(0);
    setPage(1);
    loadPage(1);
  }, [enabled, paramsKey, loadPage]);

  const loadMore = useCallback(() => {
    if (!enabled || loading || loadingMore || !hasMore) return;
    loadPage(page + 1, { append: true });
  }, [enabled, hasMore, loadPage, loading, loadingMore, page]);

  return {
    products,
    total,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    reload: () => loadPage(1),
  };
};
