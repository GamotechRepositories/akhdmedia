import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { fetchCatalog } from '../services/catalogApi';
import { getSubCategoryLabel as resolveSubCategoryLabel } from '../utils/catalogHelpers';
import { matchesProductSearch } from '../utils/productSearch';

const CatalogContext = createContext(null);

const emptyCatalog = {
  loading: true,
  error: null,
  categories: [],
  products: [],
  actors: [],
  navLinks: [],
  catalogCategories: {},
  subCategoriesMap: {},
  siteContent: null,
  source: 'api',
};

const normalize = (value) => value?.trim().toLowerCase() ?? '';

export const CatalogProvider = ({ children }) => {
  const [catalog, setCatalog] = useState(emptyCatalog);

  const loadCatalog = useCallback(async () => {
    setCatalog((current) => ({ ...current, loading: true, error: null }));

    try {
      const data = await fetchCatalog();
      setCatalog({ ...data, loading: false, error: null });
    } catch (err) {
      setCatalog({
        ...emptyCatalog,
        loading: false,
        error: err.message || 'Failed to load catalog from server',
      });
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const getProductById = useCallback(
    (id) => catalog.products.find((product) => product.id === id) ?? null,
    [catalog.products],
  );

  const getRelatedProducts = useCallback(
    (productId, limit = 4) => {
      const currentProduct = catalog.products.find((product) => product.id === productId);
      const otherProducts = catalog.products.filter((product) => product.id !== productId);

      if (!currentProduct?.actorId) {
        return otherProducts.slice(0, limit);
      }

      const sameActorProducts = otherProducts.filter(
        (product) => product.actorId && product.actorId === currentProduct.actorId,
      );
      const otherActorProducts = otherProducts.filter(
        (product) => !product.actorId || product.actorId !== currentProduct.actorId,
      );

      return [...sameActorProducts, ...otherActorProducts].slice(0, limit);
    },
    [catalog.products],
  );

  const filterProducts = useCallback(
    ({ search, category } = {}) => {
      let results = [...catalog.products];

      if (search) {
        results = results.filter((product) =>
          matchesProductSearch(product, search, catalog.subCategoriesMap),
        );
      }

      if (category) {
        const normalizedCategory = normalize(category);
        results = results.filter(
          (product) =>
            normalize(product.category) === normalizedCategory ||
            normalize(product.categorySlug) === normalizedCategory,
        );
      }

      return results;
    },
    [catalog.products, catalog.subCategoriesMap],
  );

  const getSubCategoryLabel = useCallback(
    (categorySlug, subCategorySlug) =>
      resolveSubCategoryLabel(
        catalog.subCategoriesMap,
        categorySlug,
        subCategorySlug,
      ),
    [catalog.subCategoriesMap],
  );

  const value = useMemo(
    () => ({
      ...catalog,
      refreshCatalog: loadCatalog,
      getProductById,
      getRelatedProducts,
      filterProducts,
      getSubCategoryLabel,
    }),
    [
      catalog,
      loadCatalog,
      getProductById,
      getRelatedProducts,
      filterProducts,
      getSubCategoryLabel,
    ],
  );

  if (catalog.error && !catalog.loading) {
    return (
      <CatalogContext.Provider value={value}>
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Unable to load catalog</h1>
          <p className="text-sm text-gray-600 mb-6">Network Error</p>
          <button
            type="button"
            onClick={loadCatalog}
            className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </CatalogContext.Provider>
    );
  }

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within CatalogProvider');
  }
  return context;
};
