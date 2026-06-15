export const IMAGE_SIZE_TIERS = {
  SD: { resolution: '854×480', size: '2 MB', priceFactor: 0.15 },
  HD: { resolution: '1280×720', size: '4 MB', priceFactor: 0.25 },
  'Full HD': { resolution: '1920×1080', size: '6 MB', priceFactor: 0.4 },
  '2K': { resolution: '2048×1080', size: '12 MB', priceFactor: 0.6 },
  '4K': { resolution: '3840×2160', size: '48 MB', priceFactor: 1 },
  '6K': { resolution: '6144×3456', size: '72 MB', priceFactor: 1.4 },
  '8K': { resolution: '7680×4320', size: '96 MB', priceFactor: 1.8 },
};

export const IMAGE_SIZE_ORDER = Object.keys(IMAGE_SIZE_TIERS);

export const MIN_CUSTOMER_TIER = 'HD';

const getTierRank = (tier) => {
  const index = IMAGE_SIZE_ORDER.indexOf(tier);
  return index === -1 ? IMAGE_SIZE_ORDER.length : index;
};

export const getCustomerTiers = (tiers = []) =>
  tiers.filter((tier) => getTierRank(tier) >= getTierRank(MIN_CUSTOMER_TIER));

const filterCustomerSizes = (imageSizes = {}, product = {}) => {
  const tiers = product?.availableTiers?.length
    ? product.availableTiers
    : getCustomerTiers(Object.keys(imageSizes));
  return Object.fromEntries(
    Object.entries(imageSizes).filter(([tier]) => tiers.includes(tier)),
  );
};

export const buildScaledImageSizes = (base4kPrice) =>
  Object.fromEntries(
    IMAGE_SIZE_ORDER.map((key) => {
      const tier = IMAGE_SIZE_TIERS[key];
      return [
        key,
        {
          resolution: tier.resolution,
          size: tier.size,
          price: Math.max(49, Math.round(base4kPrice * tier.priceFactor)),
        },
      ];
    })
  );

export const buildUniformImageSizes = (uniformPrice) =>
  Object.fromEntries(
    IMAGE_SIZE_ORDER.map((key) => {
      const tier = IMAGE_SIZE_TIERS[key];
      return [
        key,
        {
          resolution: tier.resolution,
          size: tier.size,
          price: uniformPrice,
        },
      ];
    })
  );

export const resolveProductImageSizes = (product) => {
  if (product?.imageSizes && Object.keys(product.imageSizes).length) {
    return filterCustomerSizes(product.imageSizes, product);
  }

  if (product?.pricingMode === 'custom' && product?.resolutionPricing) {
    return filterCustomerSizes(
      Object.fromEntries(
      IMAGE_SIZE_ORDER.map((key) => {
        const stored = product.resolutionPricing[key] || {};
        const tier = IMAGE_SIZE_TIERS[key];
        return [
          key,
          {
            resolution: stored.resolution || tier.resolution,
            size: stored.size || tier.size,
            price: Number(stored.price ?? product.price),
          },
        ];
      })
    ),
      product,
    );
  }

  if (product?.pricingMode === 'uniform') {
    const storedTiers = product?.resolutionPricing || {};
    return filterCustomerSizes(
      Object.fromEntries(
      IMAGE_SIZE_ORDER.map((key) => {
        const stored = storedTiers[key] || {};
        const tier = IMAGE_SIZE_TIERS[key];
        return [
          key,
          {
            resolution: stored.resolution || tier.resolution,
            size: stored.size || tier.size,
            price: Number(product.price),
          },
        ];
      })
    ),
      product,
    );
  }

  return filterCustomerSizes(buildScaledImageSizes(product?.price ?? 0), product);
};

/** @deprecated alias */
export const buildImageSizes = buildScaledImageSizes;

export const sortImageSizeEntries = (imageSizes = {}) => {
  const standard = IMAGE_SIZE_ORDER.filter((key) => imageSizes[key]).map((key) => [
    key,
    imageSizes[key],
  ]);
  const custom = Object.keys(imageSizes)
    .filter((key) => !IMAGE_SIZE_ORDER.includes(key))
    .map((key) => [key, imageSizes[key]]);
  return [...standard, ...custom];
};

export const getDefaultImageSize = (imageSizes = {}) => {
  if (imageSizes['4K']) return '4K';
  const available = sortImageSizeEntries(imageSizes);
  return available[available.length - 1]?.[0] ?? MIN_CUSTOMER_TIER;
};

/** Highest available tier for a product (standard order, then custom tiers). */
export const getHighestQualityLabel = (product = {}) => {
  const entries = sortImageSizeEntries(product.imageSizes || {});
  if (entries.length) return entries[entries.length - 1][0];

  const tiers = product.availableTiers || [];
  if (tiers.length) {
    const standard = IMAGE_SIZE_ORDER.filter((tier) => tiers.includes(tier));
    if (standard.length) return standard[standard.length - 1];
    return tiers[tiers.length - 1];
  }

  return null;
};

const QUALITY_BADGE_ALIASES = {
  'Full HD': 'FHD',
};

/** Short labels for quality badges on product cards */
export const formatQualityBadgeLabel = (label = '') => {
  const trimmed = String(label).trim();
  if (!trimmed) return 'HD';
  if (/^full\s*hd$/i.test(trimmed)) return 'FHD';
  return QUALITY_BADGE_ALIASES[trimmed] ?? trimmed;
};

export const formatImageSizeList = (imageSizes = {}) =>
  sortImageSizeEntries(imageSizes)
    .map(([key]) => key)
    .join(', ');
