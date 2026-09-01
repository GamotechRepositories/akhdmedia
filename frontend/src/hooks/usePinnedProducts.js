import { useEffect, useMemo, useState } from 'react';
import { fetchProductsByIds } from '../services/catalogApi';
import { useInView } from './useInView';

export const usePinnedProducts = (productIds = [], { enabled = true } = {}) => {
  const { ref, isInView } = useInView({ enabled });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const idsKey = useMemo(
    () => productIds.map((id) => String(id)).filter(Boolean).join(','),
    [productIds],
  );

  useEffect(() => {
    if (!enabled || !isInView || !idsKey) {
      if (!idsKey) {
        setProducts([]);
        setLoading(false);
      }
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchProductsByIds(idsKey.split(','))
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setProducts([]);
          setError(err.message || 'Failed to load products');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, idsKey, isInView]);

  return { ref, products, loading, isInView, error };
};
