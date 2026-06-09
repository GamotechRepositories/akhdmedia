import { Link } from 'react-router-dom';
import { useCatalog } from '../../context/CatalogContext';
import { mapCategoryPanels } from '../../utils/categoryContent';
import { CategoryAccordionSkeleton } from '../ui/HomeSectionSkeletons';
import OptimizedImage from '../ui/OptimizedImage';

const CategoryAccordion = () => {
  const { categories, loading } = useCatalog();
  const panels = mapCategoryPanels(categories);

  if (loading) return <CategoryAccordionSkeleton />;
  if (panels.length === 0) return null;

  return (
    <section className="scroll-section bg-white pt-6 pb-0 sm:pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 text-center sm:mb-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-600 sm:text-xs">
            Shot for post-production
          </span>
          <h2 className="mt-2 text-2xl font-bold text-gray-600 sm:text-3xl">Browse by Footage Type</h2>
        </div>

        {/* Mobile: horizontal scroll cards */}
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide snap-x snap-mandatory md:hidden">
          {panels.map((category) => (
            <Link
              key={category.id}
              to={`/videos/${category.id}`}
              className="group relative aspect-[3/4] w-[70vw] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-xl sm:w-[45vw]"
            >
              <OptimizedImage
                src={category.image}
                alt={category.label}
                width={560}
                height={747}
                quality={75}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-0 p-4 sm:p-5">
                <h3 className="text-lg font-bold uppercase tracking-widest text-white sm:text-xl">
                  {category.label}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-gray-200 sm:text-sm">{category.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Tablet & desktop: expanding row */}
        <div className="hidden h-[320px] w-full gap-2 md:flex lg:h-[400px]">
          {panels.map((category) => (
            <Link
              key={category.id}
              to={`/videos/${category.id}`}
              className="group relative min-w-0 flex-1 cursor-pointer overflow-hidden rounded-lg transition-all duration-500 ease-out hover:flex-[3]"
            >
              <OptimizedImage
                src={category.image}
                alt={category.label}
                width={800}
                height={500}
                quality={75}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/25 transition-colors duration-500 group-hover:bg-black/10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-90" />

              <div className="absolute bottom-0 flex w-full flex-col items-start justify-end p-4 lg:p-6">
                <h3 className="text-lg font-bold uppercase tracking-widest text-white lg:text-2xl">
                  {category.label}
                </h3>
                <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-500 group-hover:max-h-20 group-hover:opacity-100">
                  <p className="mb-2 text-sm font-medium text-gray-200">{category.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryAccordion;
