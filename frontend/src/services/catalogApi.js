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

export const fetchCatalog = async () => {
  const [categoriesRes, productsRes, siteContentRes, actorsRes] = await Promise.all([
    api.get('/categories'),
    api.get('/products'),
    api.get('/site-content').catch(() => ({ data: DEFAULT_SITE_CONTENT })),
    api.get('/actors').catch(() => ({ data: [] })),
  ]);

  const categories = categoriesRes.data;
  const products = productsRes.data.map(enrichProduct);

  return {
    categories,
    products,
    actors: sortActorsByOrder(actorsRes.data || []),
    navLinks: buildNavLinks(categories),
    catalogCategories: buildCatalogCategories(categories),
    subCategoriesMap: buildSubCategories(categories),
    siteContent: siteContentRes.data || DEFAULT_SITE_CONTENT,
    homeSections: HOME_SECTIONS,
    source: 'api',
  };
};
