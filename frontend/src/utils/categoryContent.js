const categoryPath = (slug) => `/videos/${slug}`;

const MIN_HOME_CATEGORY_PRODUCTS = 2;
const EXPANDED_HOME_CATEGORY_THRESHOLD = 5;
const DEFAULT_HOME_CATEGORY_PREVIEW = 4;
const EXPANDED_HOME_CATEGORY_PREVIEW = 8;

const getHomeCategoryPreviewLimit = (clipCount) => {
  if (clipCount >= EXPANDED_HOME_CATEGORY_THRESHOLD) {
    return EXPANDED_HOME_CATEGORY_PREVIEW;
  }
  return Math.min(clipCount, DEFAULT_HOME_CATEGORY_PREVIEW);
};

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
    .filter((category) => category.coverImage)
    .map((category) => ({
      id: category.slug,
      label: category.breadcrumb,
      desc: category.description || category.label,
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

export const mapDualGridSections = (categories = [], products = []) =>
  categories
    .map((category) => {
      const categoryProducts = products.filter(
        (product) => product.categorySlug === category.slug,
      );
      const clipCount = categoryProducts.length;

      return {
        id: category.slug,
        title: category.breadcrumb,
        link: categoryPath(category.slug),
        clipCount,
        products: categoryProducts.slice(0, getHomeCategoryPreviewLimit(clipCount)),
      };
    })
    .filter((section) => section.clipCount >= MIN_HOME_CATEGORY_PRODUCTS)
    .sort((a, b) => b.clipCount - a.clipCount);
