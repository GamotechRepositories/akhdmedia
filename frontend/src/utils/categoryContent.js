const categoryPath = (slug) => `/videos/${slug}`;

const MIN_HOME_CATEGORY_PRODUCTS = 1;
const HOME_CATEGORY_PIN_LIMIT = 8;

export const getPinnedProductsFromIds = (productIds = [], products = []) => {
  if (!productIds?.length) return [];

  const productMap = new Map(products.map((product) => [String(product.id), product]));

  return productIds
    .map((id) => productMap.get(String(id)))
    .filter(Boolean)
    .slice(0, HOME_CATEGORY_PIN_LIMIT);
};

const getPinnedCategoryProducts = (category, products = []) =>
  getPinnedProductsFromIds(category.homePinnedProductIds, products);

const compareCategorySortOrder = (left, right) => {
  const orderDiff = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);
  if (orderDiff !== 0) return orderDiff;

  return String(left.navLabel || left.breadcrumb || left.slug || '').localeCompare(
    String(right.navLabel || right.breadcrumb || right.slug || ''),
  );
};

export const mapDualGridSections = (categories = [], products = []) =>
  [...categories]
    .filter((category) => category.isActive !== false)
    .sort(compareCategorySortOrder)
    .map((category) => {
      const pinnedProducts = getPinnedCategoryProducts(category, products);

      return {
        id: category.slug,
        title: category.breadcrumb,
        link: categoryPath(category.slug),
        clipCount: pinnedProducts.length,
        products: pinnedProducts,
        sortOrder: category.sortOrder ?? 0,
      };
    })
    .filter((section) => section.clipCount >= MIN_HOME_CATEGORY_PRODUCTS);

export const mapStoryCollections = (categories = [], products = []) =>
  categories
    .filter((category) => category.coverImage)
    .map((category) => {
      const categoryProducts = products.filter(
        (product) => product.categorySlug === category.slug,
      );
      const prices = categoryProducts
        .map((product) => Number(product.price))
        .filter((price) => Number.isFinite(price) && price > 0);

      return {
        id: category.slug,
        hashtag: category.breadcrumb,
        label: category.label,
        image: category.coverImage,
        link: categoryPath(category.slug),
        clipCount: categoryProducts.length,
        minPrice: prices.length ? Math.min(...prices) : null,
      };
    });

export const mapCategoryPanels = (categories = []) =>
  categories
    .filter((category) => category.showInBrowseSection && category.coverImage)
    .map((category) => ({
      id: category.slug,
      label: category.navLabel || category.breadcrumb,
      desc: category.label,
      image: category.coverImage,
    }));

export const mapHeroSlides = (categories = []) =>
  categories
    .filter((category) => category.heroHeadline && category.coverImage)
    .map((category) => ({
      id: `hero-${category.slug}`,
      link: categoryPath(category.slug),
      badge: category.heroBadge || category.breadcrumb,
      headline: category.heroHeadline,
      subheadline: category.heroSubheadline || category.description,
      cta: category.heroCta || 'Explore',
      image: category.coverImage,
      accent: category.heroAccent || 'from-gray-900/80 via-black/50 to-transparent',
    }));

export const mapFeaturedCollections = (categories = []) =>
  categories
    .filter((category) => category.featuredTitle && category.coverImage)
    .slice(0, 2)
    .map((category) => ({
      id: category.slug,
      title: category.featuredTitle,
      subtitle: category.featuredSubtitle || category.label,
      link: categoryPath(category.slug),
      image: category.coverImage,
      gradient: category.featuredGradient || 'from-gray-900/70 to-transparent',
    }));
