import Fuse from 'fuse.js';
import { IMAGE_SIZE_TIERS } from '../constants/imageSizes';
import {
  getProductBadgeLabel,
  getProductTypeLabel,
  isImageProduct,
  isVideoProduct,
} from '../constants/mediaTypes';

const normalize = (value) => value?.trim().toLowerCase() ?? '';

const expandResolutionTerms = (resolution = '') => {
  const normalized = resolution.replace(/×/g, 'x').toLowerCase();
  const parts = normalized.split('x').map((part) => part.trim()).filter(Boolean);
  const terms = [normalized, ...parts];

  if (parts[1]) {
    terms.push(`${parts[1]}p`);
  }

  return terms;
};

const collectQualityTerms = (product) => {
  const terms = new Set();

  const addTier = (tier, tierInfo = {}) => {
    if (!tier) return;

    terms.add(tier);
    terms.add(tier.toLowerCase());
    terms.add(tier.replace(/\s+/g, '').toLowerCase());

    const catalogTier = IMAGE_SIZE_TIERS[tier] || {};
    const resolution = tierInfo.resolution || catalogTier.resolution;
    const size = tierInfo.size || catalogTier.size;

    expandResolutionTerms(resolution).forEach((term) => terms.add(term));
    if (size) terms.add(size.toLowerCase());
  };

  (product.availableTiers || []).forEach((tier) => addTier(tier));
  Object.entries(product.imageSizes || {}).forEach(([tier, info]) => addTier(tier, info));

  if (product.videoInfo?.quality) {
    terms.add(product.videoInfo.quality);
    terms.add(product.videoInfo.quality.toLowerCase());
  }

  if (product.videoInfo?.resolution) {
    expandResolutionTerms(product.videoInfo.resolution).forEach((term) => terms.add(term));
  }

  if (product.videoInfo?.format) {
    terms.add(product.videoInfo.format.toLowerCase());
  }

  return [...terms];
};

const collectMediaTypeTerms = (product) => {
  const terms = [
    product.mediaType,
    getProductBadgeLabel(product),
    getProductTypeLabel(product),
  ];

  if (isImageProduct(product)) {
    terms.push(
      'image',
      'images',
      'photo',
      'photos',
      'still',
      'stills',
      'stock image',
      'stock images',
      'picture',
      'pictures',
      'jpeg',
      'png',
    );
  }

  if (isVideoProduct(product)) {
    terms.push('video', 'videos', 'footage', 'clip', 'clips', 'mp4', 'video footage');
  }

  return terms;
};

export const buildProductSearchText = (product, subCategoriesMap = {}) => {
  const subCategoryLabel =
    subCategoriesMap[product.categorySlug]?.[product.subCategory] || '';

  const fields = [
    product.name,
    product.category,
    product.categorySlug,
    product.subCategory,
    subCategoryLabel,
    product.brand,
    product.description,
    product.clipId,
    product.actorName,
    ...(product.actorSearchKeywords || []),
    product.videoInfo?.fps,
    product.videoInfo?.duration,
    ...collectMediaTypeTerms(product),
    ...collectQualityTerms(product),
  ];

  return fields
    .filter(Boolean)
    .map(normalize)
    .join(' ');
};

const TOKEN_ALIASES = {
  photos: 'photo',
  pics: 'picture',
  pictures: 'picture',
  imgs: 'image',
  images: 'image',
  clips: 'clip',
  videos: 'video',
  stock: 'stock image',
  fullhd: 'full hd',
  fhd: 'full hd',
  uhd: '4k',
  ultra: '4k',
};

const normalizeSearchToken = (token) => TOKEN_ALIASES[token] || token;

const PRODUCT_SEARCH_FUSE_OPTIONS = {
  keys: [
    { name: 'name', weight: 0.35 },
    { name: 'actorName', weight: 0.3 },
    { name: 'actorSearchKeywords', weight: 0.15 },
    { name: 'searchText', weight: 0.12 },
    { name: 'clipId', weight: 0.04 },
    { name: 'brand', weight: 0.02 },
    { name: 'category', weight: 0.02 },
  ],
  // Allow small typos (e.g. "maduri" → "madhuri") without matching unrelated noise.
  threshold: 0.42,
  distance: 120,
  ignoreLocation: true,
  minMatchCharLength: 2,
  shouldSort: true,
};

export const createProductSearchDocuments = (products = [], subCategoriesMap = {}) =>
  products.map((product) => ({
    product,
    name: product.name || '',
    actorName: product.actorName || '',
    actorSearchKeywords: product.actorSearchKeywords || [],
    clipId: product.clipId || '',
    brand: product.brand || '',
    category: product.category || '',
    searchText: buildProductSearchText(product, subCategoriesMap),
  }));

export const createProductSearchIndex = (products = [], subCategoriesMap = {}) =>
  new Fuse(createProductSearchDocuments(products, subCategoriesMap), PRODUCT_SEARCH_FUSE_OPTIONS);

/** Exact substring match (legacy). Prefer filterProductsBySearch for typo tolerance. */
export const matchesProductSearch = (product, query, subCategoriesMap = {}) => {
  const normalized = normalize(query);
  if (!normalized) return true;

  const haystack = buildProductSearchText(product, subCategoriesMap);
  const tokens = normalized.split(/\s+/).filter(Boolean).map(normalizeSearchToken);

  return tokens.every((token) => haystack.includes(token));
};

/**
 * Typo-tolerant product search (Fuse.js), same approach as actor search.
 * Multi-word queries keep AND semantics: every token must match.
 */
export const filterProductsBySearch = (
  products = [],
  query,
  subCategoriesMap = {},
  searchIndex = null,
) => {
  const normalized = normalize(query);
  if (!normalized) return products;

  const tokens = normalized.split(/\s+/).filter(Boolean).map(normalizeSearchToken);
  if (!tokens.length) return products;

  const fuse = searchIndex || createProductSearchIndex(products, subCategoriesMap);
  const getProduct = (result) => result.item.product;
  const getId = (product) => product?.id ?? product?._id;

  if (tokens.length === 1) {
    return fuse.search(tokens[0]).map(getProduct);
  }

  let matchedIds = null;
  for (const token of tokens) {
    const ids = new Set(fuse.search(token).map((result) => getId(getProduct(result))));
    matchedIds = matchedIds
      ? new Set([...matchedIds].filter((id) => ids.has(id)))
      : ids;

    if (!matchedIds.size) return [];
  }

  // Keep relevance order from the first token, then intersect.
  const ordered = fuse.search(tokens[0]).map(getProduct);
  const seen = new Set();
  return ordered.filter((product) => {
    const id = getId(product);
    if (!matchedIds.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};
