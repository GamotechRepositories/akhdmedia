export const SORT_OPTIONS = [
  { id: 'default', label: 'Recommended' },
  { id: 'newest', label: 'Newest Arrivals' },
  { id: 'price-low-high', label: 'Price: Low to High' },
  { id: 'price-high-low', label: 'Price: High to Low' },
];

export const RESOLUTION_OPTIONS = [
  'SD',
  'HD',
  'Full HD',
  '2K',
  '4K',
  '6K',
  '8K',
];

export const FPS_OPTIONS = ['24 fps', '30 fps', '60 fps', '120 fps'];

export const DEFAULT_CATALOG_FILTERS = {
  priceRange: null,
  brands: [],
  resolutions: [],
  fps: [],
  sortBy: 'default',
};
