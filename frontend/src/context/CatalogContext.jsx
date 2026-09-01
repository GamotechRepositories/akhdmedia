import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  fetchCatalogMetadata,
  fetchProductById,
  fetchProductsPage,
  fetchSiteContent,
} from '../services/catalogApi';
import { getSubCategoryLabel as resolveSubCategoryLabel } from '../utils/catalogHelpers';
import { getProductActorIds, productsShareActor } from '../utils/productActors';

const CatalogContext = createContext(null);

const emptyCatalog = {
  loading: true,
  siteContentLoading: true,
  error: null,
  categories: [],
  actors: [],
  navLinks: [],
  catalogCategories: {},
  subCategoriesMap: {},
  siteContent: null,
  source: 'api',
};

export const CatalogProvider = ({ children }) => {
  const [catalog, setCatalog] = useState(emptyCatalog);
  const productCacheRef = useRef(new Map());

  const rememberProducts = useCallback((products = []) => {
    products.forEach((product) => {
      if (product?.id) {
        productCacheRef.current.set(product.id, product);
      }
    });
  }, []);

  const loadCatalog = useCallback(async () => {
    setCatalog((current) => ({
      ...current,
      loading: true,
      siteContentLoading: true,
      error: null,
    }));

    try {
      const siteContentPromise = fetchSiteContent();
      const metadataPromise = fetchCatalogMetadata({
        siteContent: siteContentPromise,
      });

      const siteContent = await siteContentPromise;
      setCatalog((current) => ({
        ...current,
        siteContent,
        siteContentLoading: false,
      }));

      const data = await metadataPromise;
      setCatalog({
        ...data,
        loading: false,
        siteContentLoading: false,
        error: null,
      });
    } catch (err) {
      setCatalog((current) => ({
        ...emptyCatalog,
        siteContent: current.siteContent,
        siteContentLoading: false,
        loading: false,
        error: err.message || 'Failed to load catalog from server',
      }));
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const getProductById = useCallback(
    async (id) => {
      if (!id) return null;

      const cached = productCacheRef.current.get(id);
      if (cached) return cached;

      const product = await fetchProductById(id);
      rememberProducts([product]);
      return product;
    },
    [rememberProducts],
  );

  const getRelatedProducts = useCallback(
    async (productId, limit = 32) => {
      const currentProduct =
        productCacheRef.current.get(productId) || (await getProductById(productId));

      if (!currentProduct) return [];

      const { products } = await fetchProductsPage({
        categorySlug: currentProduct.categorySlug,
        page: 1,
        limit: Math.min(limit + 8, 60),
      });

      rememberProducts(products);

      const otherProducts = products.filter((product) => product.id !== productId);
      const currentActorIds = getProductActorIds(currentProduct);

      if (!currentActorIds.length) {
        return otherProducts.slice(0, limit);
      }

      const sameActorProducts = otherProducts.filter((product) =>
        productsShareActor(currentProduct, product),
      );
      const otherActorProducts = otherProducts.filter(
        (product) => !productsShareActor(currentProduct, product),
      );

      return [...sameActorProducts, ...otherActorProducts].slice(0, limit);
    },
    [getProductById, rememberProducts],
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
      getSubCategoryLabel,
      rememberProducts,
    }),
    [
      catalog,
      loadCatalog,
      getProductById,
      getRelatedProducts,
      getSubCategoryLabel,
      rememberProducts,
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
