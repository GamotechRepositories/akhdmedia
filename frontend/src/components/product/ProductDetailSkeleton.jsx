import ProductSkeleton from '../ui/ProductSkeleton';

const barClass = 'animate-pulse rounded bg-gray-200';

const ProductDetailSkeleton = () => (
  <div className="min-h-screen bg-[#f4f5f7]">
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full min-w-0 max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className={`h-5 w-16 ${barClass}`} />
        <div className={`hidden h-4 w-48 sm:block ${barClass}`} />
      </div>
    </div>

    <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid w-full min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:gap-8">
        <div className="relative z-10 min-w-0 w-full xl:sticky xl:top-24 xl:self-start">
          <div className={`aspect-[4/5] w-full rounded-2xl ${barClass}`} />
        </div>

        <div className="relative z-0 min-w-0 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-900 px-5 py-5 sm:px-6">
            <div className="mb-3 flex gap-2">
              <div className={`h-6 w-20 rounded-full bg-gray-700`} />
              <div className={`h-6 w-24 rounded-full bg-gray-700`} />
            </div>
            <div className={`mb-2 h-8 w-full max-w-lg bg-gray-700`} />
            <div className={`mb-1 h-4 w-32 bg-gray-700`} />
            <div className={`mb-4 h-4 w-48 bg-gray-700`} />
            <div className={`mb-2 h-3 w-full bg-gray-700`} />
            <div className={`mb-2 h-3 w-3/4 bg-gray-700`} />
            <div className={`h-3 w-2/3 bg-gray-700`} />
            <div className="mt-5 border-t border-white/10 pt-4">
              <div className={`mb-2 h-3 w-28 bg-gray-700`} />
              <div className={`h-10 w-32 bg-gray-700`} />
            </div>
          </div>

          <div className="space-y-4 px-5 py-4 sm:px-6">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className={`h-12 rounded-xl ${barClass}`} />
              <div className={`h-12 rounded-xl ${barClass}`} />
            </div>
          </div>

          <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 sm:px-6">
            <div className={`mb-3 h-4 w-40 ${barClass}`} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className={`h-14 rounded-lg ${barClass}`} />
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 px-5 py-4 sm:px-6">
            <div className={`mb-3 h-4 w-24 ${barClass}`} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index}>
                  <div className={`mb-1 h-3 w-16 ${barClass}`} />
                  <div className={`h-4 w-24 ${barClass}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-gray-200 pt-8">
        <div className={`mb-6 h-7 w-40 ${barClass}`} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <ProductSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default ProductDetailSkeleton;
