import ProductSkeleton from './ProductSkeleton';
import { HOME_PRODUCT_GRID, PAGE_CONTAINER } from '../../constants/layout';

export const HeroSkeleton = () => (
  <section className="relative w-full overflow-hidden bg-gray-950">
    <div className="relative mx-auto aspect-[4/3] w-full max-w-[2000px] animate-pulse bg-gray-800 sm:aspect-[16/10] md:hidden" />
    <div className="relative mx-auto hidden aspect-[21/9] w-full max-w-[2000px] animate-pulse bg-gray-800 md:block lg:aspect-[3/1]" />
  </section>
);

export const StoryRailSkeleton = () => (
  <section className="border-b border-gray-100 bg-gray-50 py-8 sm:py-10">
    <div className={PAGE_CONTAINER}>
      <div className="mb-5 border-b border-gray-200 pb-4 sm:mb-6">
        <div className="h-3 w-36 animate-pulse rounded bg-gray-100" />
        <div className="mt-2 h-8 w-56 animate-pulse rounded bg-gray-200 sm:h-9" />
        <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-gray-100" />
      </div>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:gap-5 md:mx-0 md:px-0">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="w-[220px] shrink-0 sm:w-[260px]">
            <div className="aspect-video animate-pulse rounded-xl bg-gray-200" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export const CategoryAccordionSkeleton = () => (
  <section className="bg-white pt-2 pb-0 sm:pt-3">
    <div className={PAGE_CONTAINER}>
      <div className="mb-6 text-center sm:mb-8">
        <div className="mx-auto h-3 w-36 animate-pulse rounded bg-gray-100" />
        <div className="mx-auto mt-3 h-8 w-56 animate-pulse rounded bg-gray-200 sm:h-9 sm:w-72" />
      </div>

      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-3 md:hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="aspect-[4/5] w-[44vw] max-w-[155px] shrink-0 animate-pulse rounded-lg bg-gray-200"
          />
        ))}
      </div>

      <div className="hidden h-[320px] gap-2 overflow-x-auto pb-2 scrollbar-hide md:flex lg:h-[400px]">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="w-[calc((100%-2rem)/5)] shrink-0 animate-pulse rounded-lg bg-gray-200"
          />
        ))}
      </div>
    </div>
  </section>
);

export const DualCategoryGridSkeleton = () => (
  <section className={`${PAGE_CONTAINER} pb-8 sm:pb-10`}>
    <div className="flex flex-col gap-8 lg:gap-10">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i}>
          <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="h-8 w-40 animate-pulse rounded bg-gray-200 sm:h-9 sm:w-48" />
            </div>
            <div className="hidden h-10 w-24 shrink-0 animate-pulse rounded-full bg-gray-200 sm:block" />
          </div>
          <div className={HOME_PRODUCT_GRID}>
            {Array.from({ length: 4 }, (_, j) => (
              <ProductSkeleton key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  </section>
);

export const FeaturedCollectionsSkeleton = () => (
  <section className={`${PAGE_CONTAINER} mb-8 mt-8 sm:mt-12`}>
    <div className="mb-6 text-center sm:mb-8">
      <div className="mx-auto h-8 w-40 animate-pulse rounded bg-gray-200 sm:h-9 sm:w-48" />
      <div className="mx-auto mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-gray-100" />
    </div>
    <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="aspect-[16/9] animate-pulse rounded-2xl bg-gray-200 shadow-md" />
      ))}
    </div>
  </section>
);

export const ProductSectionSkeleton = ({ title, subtitle }) => (
  <section className="bg-white py-10 sm:py-14 lg:py-16">
    <div className={PAGE_CONTAINER}>
      <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {title ? (
            <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">{title}</h2>
          ) : (
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200 sm:h-9" />
          )}
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500 sm:text-base">{subtitle}</p>
          ) : (
            <div className="mt-2 h-4 w-64 max-w-full animate-pulse rounded bg-gray-100" />
          )}
        </div>
        <div className="hidden h-10 w-24 shrink-0 animate-pulse rounded-full bg-gray-200 sm:block" />
      </div>
      <div className={HOME_PRODUCT_GRID}>
        {Array.from({ length: 4 }, (_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    </div>
  </section>
);
