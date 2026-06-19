import { useMemo } from 'react';
import { IMAGE_SIZE_ORDER } from '../constants/imageSizes';

const getPrice = (product) => product.price || 0;

const matchesPriceRange = (product, priceRange) => {
  if (!priceRange) return true;
  const price = getPrice(product);
  const min = priceRange.min ?? 0;
  const max = priceRange.max ?? Infinity;
  return price >= min && price <= max;
};

const matchesResolutions = (product, resolutions) => {
  if (!resolutions?.length) return true;
  const available = Object.keys(product.imageSizes || {});
  return resolutions.some((res) => available.includes(res));
};

const matchesFps = (product, fpsFilters) => {
  if (!fpsFilters?.length) return true;
  const productFps = product.videoInfo?.fps;
  return fpsFilters.includes(productFps);
};

const sortProducts = (products, sortBy, listingOrderKey = null) => {
  const sorted = [...products];

  sorted.sort((a, b) => {
    const priceA = getPrice(a);
    const priceB = getPrice(b);

    switch (sortBy) {
      case 'price-low-high':
        return priceA - priceB;
      case 'price-high-low':
        return priceB - priceA;
      case 'newest':
        return Number(b.id) - Number(a.id);
      default: {
        if (listingOrderKey) {
          const orderDiff =
            (a[listingOrderKey] ?? 0) - (b[listingOrderKey] ?? 0);
          if (orderDiff !== 0) return orderDiff;
        }
        return (b.rating || 0) - (a.rating || 0);
      }
    }
  });

  return sorted;
};

export const useCatalogFilters = (products, filters, listingOrderKey = null) =>
  useMemo(() => {
    let result = [...products];

    if (filters.brands?.length) {
      result = result.filter((p) => filters.brands.includes(p.brand));
    }

    result = result.filter((p) => matchesPriceRange(p, filters.priceRange));
    result = result.filter((p) => matchesResolutions(p, filters.resolutions));
    result = result.filter((p) => matchesFps(p, filters.fps));

    return sortProducts(result, filters.sortBy, listingOrderKey);
  }, [products, filters, listingOrderKey]);

export const extractCatalogFacets = (products) => {
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();
  const availableResolutions = new Set(
    products.flatMap((p) => Object.keys(p.imageSizes || {}))
  );
  const resolutions = IMAGE_SIZE_ORDER.filter((res) =>
    availableResolutions.has(res)
  );
  const fps = [
    ...new Set(products.map((p) => p.videoInfo?.fps).filter(Boolean)),
  ];

  return { brands, resolutions, fps };
};

export const filterByCategory = (products, category, subCategory = null) => {
  let result = [...products];

  if (category) {
    const normalizedCategory = category.toLowerCase();
    result = result.filter(
      (p) =>
        p.categorySlug?.toLowerCase() === normalizedCategory ||
        p.category?.toLowerCase() === normalizedCategory
    );
  }

  if (subCategory) {
    result = result.filter((p) => p.subCategory === subCategory);
  }

  return result;
};
