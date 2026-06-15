import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard';
import { DUAL_CATEGORY_PRODUCT_GRID } from '../../constants/layout';
import { useCatalog } from '../../context/CatalogContext';
import { mapDualGridSections } from '../../utils/categoryContent';
import { DualCategoryGridSkeleton } from '../ui/HomeSectionSkeletons';

const DualCategoryGrid = () => {
  const { categories, products, loading } = useCatalog();
  const sections = mapDualGridSections(categories, products);

  if (loading) return <DualCategoryGridSkeleton />;
  if (sections.length === 0) return null;

  return (
    <section className="scroll-section mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:gap-12">
        {sections.map((section) => (
          <div key={section.id}>
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-gray-200 pb-4 sm:mb-5">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
                  {section.title}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {section.clipCount} {section.clipCount === 1 ? 'clip' : 'clips'}
                </p>
              </div>
              <Link
                to={section.link}
                className="shrink-0 rounded-full border border-gray-900 bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 sm:px-5 sm:text-sm"
              >
                View All
              </Link>
            </div>

            <div className={DUAL_CATEGORY_PRODUCT_GRID}>
              {section.products.map((product) => (
                <ProductCard key={product.id} product={product} compact />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DualCategoryGrid;
