import api from '../api/axios';
import { TICKER_ITEMS, HOME_SECTIONS } from '../constants/siteContent';
import {
  buildCatalogCategories,
  buildNavLinks,
  buildSubCategories,
  enrichProduct,
} from '../utils/catalogHelpers';

const DEFAULT_SITE_CONTENT = {
  tickerItems: TICKER_ITEMS,
  browseSection: {
    eyebrow: 'Shot for post-production',
    title: 'Browse by Editorial Footage Type',
  },
  heroSlides: [],
  showActorsSection: true,
  homeLatestProductIds: [],
  homeLatestHomepageProductIds: [],
};

const sortActorsByOrder = (actors = []) =>
  [...actors].sort((left, right) => {
    const orderDiff = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return String(left.id || '').localeCompare(String(right.id || ''));
  });

export { DEFAULT_SITE_CONTENT };

/** Lightweight first paint payload (hero / ticker) — do not wait on products. */
export const fetchSiteContent = async () => {
  try {
    const { data } = await api.get('/site-content');
    return data || DEFAULT_SITE_CONTENT;
  } catch {
    return DEFAULT_SITE_CONTENT;
  }
};

export const fetchCatalogMetadata = async ({ siteContent } = {}) => {
  const [categoriesRes, actorsRes, resolvedSiteContent] = await Promise.all([
    api.get('/categories'),
    api.get('/actors').catch(() => ({ data: [] })),
    siteContent != null ? Promise.resolve(siteContent) : fetchSiteContent(),
  ]);

  const categories = categoriesRes.data;

  return {
    categories,
    actors: sortActorsByOrder(actorsRes.data || []),
    navLinks: buildNavLinks(categories),
    catalogCategories: buildCatalogCategories(categories),
    subCategoriesMap: buildSubCategories(categories),
    siteContent: resolvedSiteContent || DEFAULT_SITE_CONTENT,
    homeSections: HOME_SECTIONS,
    source: 'api',
  };
};

const normalizeProductsResponse = (data) => {
  if (Array.isArray(data)) {
    return data.map(enrichProduct);
  }

  if (Array.isArray(data?.products)) {
    return data.products.map(enrichProduct);
  }

  if (Array.isArray(data?.data?.products)) {
    return data.data.products.map(enrichProduct);
  }

  return [];
};

export const fetchProductsPage = async (params = {}) => {
  const { data } = await api.get('/products', { params });
  const products = normalizeProductsResponse(data);
  const pagination = data?.pagination || data?.data?.pagination || {
    page: params.page || 1,
    limit: params.limit || products.length,
    total: products.length,
    totalPages: 1,
  };

  return { products, pagination };
};

export const fetchProductsByIds = async (ids = []) => {
  const uniqueIds = [...new Set(ids.map((id) => String(id)).filter(Boolean))];
  if (!uniqueIds.length) return [];

  const { products } = await fetchProductsPage({ ids: uniqueIds.join(',') });
  return products;
};

export const fetchProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return enrichProduct(data);
};

/** @deprecated Use fetchCatalogMetadata + section-specific product fetches. */
export const fetchCatalog = async ({ siteContent } = {}) => {
  const metadata = await fetchCatalogMetadata({ siteContent });
  const { products } = await fetchProductsPage({ page: 1, limit: 60 });

  return {
    ...metadata,
    products,
  };
};
