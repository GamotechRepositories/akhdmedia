import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import HeroCarousel from '../components/home/HeroCarousel';
import ActorRail from '../components/home/ActorRail';
import NewsTicker from '../components/home/NewsTicker';
import CategoryAccordion from '../components/home/CategoryAccordion';
import ProductSection from '../components/home/ProductSection';
import DualCategoryGrid from '../components/home/DualCategoryGrid';
import { HOME_SECTIONS } from '../constants/siteContent';
import { useCatalog } from '../context/CatalogContext';

const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { products, actors, loading, siteContent } = useCatalog();
  const latestProducts = products.filter((product) => product.showInLatest).slice(0, 8);
  const showActorsSection = siteContent?.showActorsSection !== false;

  useEffect(() => {
    const search = searchParams.get('search')?.trim();
    if (search) {
      navigate(`/videos?search=${encodeURIComponent(search)}`, { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      <HeroCarousel />
      <NewsTicker />
      {showActorsSection ? (
        <ActorRail
          actors={actors}
          isLoading={loading}
          viewAllLink={HOME_SECTIONS.actors.viewAllLink}
        />
      ) : null}
      <CategoryAccordion />

      <ProductSection
        title={HOME_SECTIONS.freshDrops.title}
        products={latestProducts}
        viewAllLink={HOME_SECTIONS.freshDrops.viewAllLink}
        isLoading={loading}
        tightTop
      />

      <DualCategoryGrid />
    </div>
  );
};

export default Home;
