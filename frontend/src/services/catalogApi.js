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
    title: 'Browse by Footage Type',
  },
};

export const fetchCatalog = async () => {
  const [categoriesRes, productsRes, siteContentRes] = await Promise.all([
    api.get('/categories'),
    api.get('/products'),
    api.get('/site-content').catch(() => ({ data: DEFAULT_SITE_CONTENT })),
  ]);

  const categories = categoriesRes.data;
  const products = productsRes.data.map(enrichProduct);

  return {
    categories,
    products,
    navLinks: buildNavLinks(categories),
    catalogCategories: buildCatalogCategories(categories),
    subCategoriesMap: buildSubCategories(categories),
    siteContent: siteContentRes.data || DEFAULT_SITE_CONTENT,
    homeSections: HOME_SECTIONS,
    source: 'api',
  };
};
