import { Link } from 'react-router-dom';
import ProductCard from '../ProductCard';
import ProductSkeleton from '../ui/ProductSkeleton';
import { HOME_PRODUCT_GRID, PAGE_CONTAINER } from '../../constants/layout';
import { usePinnedProducts } from '../../hooks/usePinnedProducts';

const headerBarItemClass = 'inline-flex h-8 items-center sm:h-9';

const ProductSection = ({
  title,
  productIds = [],
  viewAllLink,
  bgColor = 'bg-white',
  tightTop = false,
}) => {
  const { ref, products, loading } = usePinnedProducts(productIds);

  return (
    <section
      ref={ref}
      className={`scroll-section ${tightTop ? 'pt-4 sm:pt-6 lg:pt-[50px] pb-4 sm:pb-6 lg:pb-8' : 'py-10 sm:py-14 lg:py-16'} ${bgColor}`}
    >
      <div className={PAGE_CONTAINER}>
        <div className="mb-6 flex items-center justify-between gap-3 border-b border-gray-200 pb-4 sm:mb-8">
          <h2 className="min-w-0 text-xl font-extrabold leading-tight text-gray-900 sm:text-2xl lg:text-3xl">
            {title}
          </h2>
          {viewAllLink && (
            <Link
              to={viewAllLink}
              className={`${headerBarItemClass} shrink-0 rounded-full border border-gray-300 bg-gray-900 px-4 text-xs font-semibold text-white sm:px-5 sm:text-sm`}
            >
              View All
            </Link>
          )}
        </div>

        <div className={HOME_PRODUCT_GRID}>
          {loading
            ? Array.from({ length: 4 }, (_, index) => <ProductSkeleton key={index} />)
            : products.length > 0
              ? products.map((product) => <ProductCard key={product.id} product={product} />)
              : null}
        </div>
      </div>
    </section>
  );
};

export default ProductSection;
