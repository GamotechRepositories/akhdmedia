import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard';
import { HOME_PRODUCT_GRID, PAGE_CONTAINER } from '../../constants/layout';
import { useCatalog } from '../../context/CatalogContext';
import { mapDualGridSections } from '../../utils/categoryContent';
import { DualCategoryGridSkeleton } from '../ui/HomeSectionSkeletons';

const DualCategoryGrid = () => {
  const { categories, products, loading } = useCatalog();
  const sections = mapDualGridSections(categories, products);

  if (loading) return <DualCategoryGridSkeleton />;
  if (sections.length === 0) return null;

  return (
    <section className="scroll-section pb-8 sm:pb-10 lg:pb-12">
      <div className={`${PAGE_CONTAINER} flex flex-col gap-8 lg:gap-10`}>
        {sections.map((section) => (
          <div key={section.id}>
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
              {section.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
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
        ))}
      </div>
    </section>
  );
};

export default DualCategoryGrid;
