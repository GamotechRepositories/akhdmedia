import { DEFAULT_CATALOG_FILTERS, SORT_OPTIONS } from '../constants/catalog';

export const CATALOG_FILTER_PARAM_KEYS = [
  'sort',
  'resolutions',
  'brands',
  'fps',
  'minPrice',
  'maxPrice',
  'page',
];

const VALID_SORT = new Set(SORT_OPTIONS.map((option) => option.id));

const splitList = (value) => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const joinList = (values = []) => values.filter(Boolean).join(',');

export const parseCatalogFiltersFromSearchParams = (searchParams) => {
  const sort = searchParams.get('sort');
  const sortBy = VALID_SORT.has(sort) ? sort : DEFAULT_CATALOG_FILTERS.sortBy;

  const minRaw = searchParams.get('minPrice');
  const maxRaw = searchParams.get('maxPrice');
  const min = minRaw !== null && minRaw !== '' ? Number(minRaw) : undefined;
  const max = maxRaw !== null && maxRaw !== '' ? Number(maxRaw) : undefined;

  let priceRange = null;
  if (Number.isFinite(min) || Number.isFinite(max)) {
    priceRange = {
      ...(Number.isFinite(min) ? { min } : {}),
      ...(Number.isFinite(max) ? { max } : {}),
    };
  }

  return {
    priceRange,
    brands: splitList(searchParams.get('brands')),
    resolutions: splitList(searchParams.get('resolutions')),
    fps: splitList(searchParams.get('fps')),
    sortBy,
  };
};

export const applyCatalogFiltersToSearchParams = (params, filters) => {
  if (filters.sortBy && filters.sortBy !== DEFAULT_CATALOG_FILTERS.sortBy) {
    params.set('sort', filters.sortBy);
  } else {
    params.delete('sort');
  }

  const resolutions = joinList(filters.resolutions);
  if (resolutions) params.set('resolutions', resolutions);
  else params.delete('resolutions');

  const brands = joinList(filters.brands);
  if (brands) params.set('brands', brands);
  else params.delete('brands');

  const fps = joinList(filters.fps);
  if (fps) params.set('fps', fps);
  else params.delete('fps');

  if (Number.isFinite(filters.priceRange?.min)) {
    params.set('minPrice', String(filters.priceRange.min));
  } else {
    params.delete('minPrice');
  }

  if (Number.isFinite(filters.priceRange?.max)) {
    params.set('maxPrice', String(filters.priceRange.max));
  } else {
    params.delete('maxPrice');
  }
};

export const clearCatalogFilterParams = (params) => {
  CATALOG_FILTER_PARAM_KEYS.forEach((key) => params.delete(key));
};

export const parseCatalogPageFromSearchParams = (searchParams) => {
  const page = Number(searchParams.get('page'));
  return Number.isFinite(page) && page > 1 ? Math.floor(page) : 1;
};
