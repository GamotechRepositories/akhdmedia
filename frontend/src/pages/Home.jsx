import HeroCarousel from '../components/home/HeroCarousel';
import NewsTicker from '../components/home/NewsTicker';
import CategoryAccordion from '../components/home/CategoryAccordion';
import ProductSection from '../components/home/ProductSection';
import DualCategoryGrid from '../components/home/DualCategoryGrid';
import FeaturedCollections from '../components/home/FeaturedCollections';
import { HOME_SECTIONS } from '../constants/siteContent';
import { useProductFilters } from '../hooks/useProductFilters';

const Home = () => {
  const { products, resultsLabel, count, loading } = useProductFilters();
  const latestProducts = products.slice(0, 8);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      <HeroCarousel />
      <NewsTicker />
      <CategoryAccordion />

      {resultsLabel && (
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">{resultsLabel}</h2>
          <p className="mt-1 text-sm text-gray-500">{count} clips available</p>
        </div>
      )}

      <ProductSection
        title={HOME_SECTIONS.freshDrops.title}
        subtitle={HOME_SECTIONS.freshDrops.subtitle}
        products={latestProducts}
        viewAllLink={HOME_SECTIONS.freshDrops.viewAllLink}
        isLoading={loading}
        tightTop
      />

      <DualCategoryGrid />
      <FeaturedCollections />

    </div>
  );
};

export default Home;
