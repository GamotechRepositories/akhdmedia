import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard';
import ProductSkeleton from '../ui/ProductSkeleton';
import { HOME_PRODUCT_GRID, PAGE_CONTAINER, SECTION_TITLE } from '../../constants/layout';

const ProductSection = ({
  title,
  subtitle,
  products,
  viewAllLink,
  bgColor = 'bg-white',
  isLoading = false,
  tightTop = false,
}) => (
  <section
    className={`scroll-section ${tightTop ? 'pt-[50px] pb-10 sm:pb-14 lg:pb-16' : 'py-10 sm:py-14 lg:py-16'} ${bgColor}`}
  >
    <div className={PAGE_CONTAINER}>
      <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className={SECTION_TITLE}>{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-gray-500 sm:text-base">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="hidden shrink-0 rounded-full border border-gray-300 bg-gray-900 px-5 py-2 text-sm font-semibold text-white sm:inline-block"
          >
            View All
          </Link>
        )}
      </div>

      <div className={HOME_PRODUCT_GRID}>
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => <ProductSkeleton key={i} />)
          : products.length > 0
            ? products.map((product) => <ProductCard key={product.id} product={product} />)
            : (
              <p className="col-span-full py-10 text-center text-sm text-gray-500 sm:text-base">
                No footage matches your filters.
              </p>
            )}
      </div>

      {viewAllLink && (
        <div className="mt-6 text-center sm:mt-8 sm:hidden">
          <Link
            to={viewAllLink}
            className="inline-block w-full max-w-xs rounded-full bg-gray-900 px-8 py-3 text-sm font-semibold text-white shadow-lg"
          >
            View All
          </Link>
        </div>
      )}
    </div>
  </section>
);

export default ProductSection;
