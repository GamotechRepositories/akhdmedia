import { resolveProductImageSizes } from '../constants/imageSizes';

export const enrichProduct = (product) => ({
  ...product,
  mediaType: product.mediaType || 'video',
  pricingMode: product.pricingMode || 'uniform',
  imageSizes: resolveProductImageSizes(product),
});

export const buildNavLinks = (categories = []) =>
  categories
    .filter((category) => category.isActive)
    .map((category) => ({
      id: category.slug,
      label: category.navLabel,
      path: `/videos/${category.slug}`,
      subItems: (category.subCategories || []).map((subCategory) => ({
        name: subCategory.name,
        path: `/videos/${category.slug}/${subCategory.slug}`,
      })),
    }));

export const buildCatalogCategories = (categories = []) =>
  Object.fromEntries(
    categories.map((category) => [
      category.slug,
      { label: category.label, breadcrumb: category.breadcrumb },
    ])
  );

export const buildSubCategories = (categories = []) =>
  Object.fromEntries(
    categories.map((category) => [
      category.slug,
      Object.fromEntries(
        (category.subCategories || []).map((subCategory) => [
          subCategory.slug,
          subCategory.name,
        ])
      ),
    ])
  );

export const getSubCategoryLabel = (subCategoriesMap, categorySlug, subCategorySlug) =>
  subCategoriesMap[categorySlug]?.[subCategorySlug] ?? null;
