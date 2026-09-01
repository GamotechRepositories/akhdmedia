import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard';
import ProductSkeleton from '../ui/ProductSkeleton';
import { HOME_PRODUCT_GRID, PAGE_CONTAINER } from '../../constants/layout';
import { useCatalog } from '../../context/CatalogContext';
import { mapDualGridSections } from '../../utils/categoryContent';
import { DualCategoryGridSkeleton } from '../ui/HomeSectionSkeletons';
import { usePinnedProducts } from '../../hooks/usePinnedProducts';

const DualCategorySection = ({ section, rememberProducts }) => {
  const productIds = useMemo(
    () => section.products.map((product) => product.id),
    [section.products],
  );
  const { ref, products, loading } = usePinnedProducts(productIds);

  useEffect(() => {
    rememberProducts(products);
  }, [products, rememberProducts]);

  return (
    <div ref={ref}>
      <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            {section.title}
          </h2>
        </div>
        <Link
          to={section.link}
          className="hidden shrink-0 rounded-full border border-gray-300 bg-gray-900 px-5 py-2 text-sm font-semibold text-white sm:inline-block"
        >
          View All
        </Link>
      </div>

      <div className={HOME_PRODUCT_GRID}>
        {loading
          ? Array.from({ length: 4 }, (_, index) => <ProductSkeleton key={index} />)
          : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>

      <div className="mt-6 text-center sm:mt-8 sm:hidden">
        <Link
          to={section.link}
          className="inline-block w-full max-w-xs rounded-full bg-gray-900 px-8 py-3 text-sm font-semibold text-white shadow-lg"
        >
          View All
        </Link>
      </div>
    </div>
  );
};

const DualCategoryGrid = () => {
  const { categories, loading, rememberProducts } = useCatalog();
  const sections = useMemo(
    () => mapDualGridSections(categories, []),
    [categories],
  );

  if (loading) return <DualCategoryGridSkeleton />;
  if (sections.length === 0) return null;

  return (
    <section className="scroll-section pb-8 sm:pb-10 lg:pb-12">
      <div className={`${PAGE_CONTAINER} flex flex-col gap-8 lg:gap-10`}>
        {sections.map((section) => (
          <DualCategorySection
            key={section.id}
            section={section}
            rememberProducts={rememberProducts}
          />
        ))}
      </div>
    </section>
  );
};

export default DualCategoryGrid;
