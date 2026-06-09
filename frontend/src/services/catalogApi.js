import api from '../api/axios';
import {
  buildCatalogCategories,
  buildNavLinks,
  buildSubCategories,
  enrichProduct,
} from '../utils/catalogHelpers';

export const fetchCatalog = async () => {
  const [categoriesRes, productsRes] = await Promise.all([
    api.get('/categories'),
    api.get('/products'),
  ]);

  const categories = categoriesRes.data;
  const products = productsRes.data.map(enrichProduct);

  return {
    categories,
    products,
    navLinks: buildNavLinks(categories),
    catalogCategories: buildCatalogCategories(categories),
    subCategoriesMap: buildSubCategories(categories),
    source: 'api',
  };
};
