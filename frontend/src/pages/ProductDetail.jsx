import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductMediaGallery from '../components/product/ProductMediaGallery';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/ToastContainer';
import { useCatalog } from '../context/CatalogContext';
import {
  getDefaultImageSize,
  sortImageSizeEntries,
} from '../constants/imageSizes';
import {
  getProductTypeLabel,
  getResolutionSectionCopy,
  isVideoProduct,
} from '../constants/mediaTypes';
import { formatCurrency } from '../utils/formatters';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProductById, getRelatedProducts, loading: catalogLoading } = useCatalog();
  const { addToCart } = useCart();
  const { success } = useToast();

  const [product, setProduct] = useState(null);
  const [selectedImageSize, setSelectedImageSize] = useState('');

  useEffect(() => {
    const found = getProductById(id);
    setProduct(found);
    setSelectedImageSize(found ? getDefaultImageSize(found.imageSizes) : '');
  }, [id, getProductById, catalogLoading]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-6">The item you are looking for doesn't exist.</p>
        <Link to="/" className="bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
          Back to Home
        </Link>
      </div>
    );
  }

  const isVideo = isVideoProduct(product);
  const finalPrice = product.imageSizes[selectedImageSize]?.price || product.price;
  const relatedProducts = getRelatedProducts(product.id);
  const resolutionCopy = getResolutionSectionCopy(product);
  const nameWords = product.name.split(' ');

  const handleAddToCart = async () => {
    try {
      await addToCart(product, 1, selectedImageSize);
      success('Added to cart');
    } catch (error) {
      console.error(error);
    }
  };

  const handleBuyNow = async () => {
    try {
      await addToCart(product, 1, selectedImageSize);
      navigate('/checkout');
    } catch (error) {
      console.error(error);
    }
  };

  const resolutionSection = (
    <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-3.5">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-900">
          {resolutionCopy.title}
        </h3>
        <p className="text-[11px] text-gray-500">{resolutionCopy.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">        {sortImageSizeEntries(product.imageSizes).map(([size, info]) => {
          const isSelected = selectedImageSize === size;
          return (
            <button
              key={size}
              type="button"
              onClick={() => setSelectedImageSize(size)}
              className={`rounded-md border px-2 py-1.5 text-left transition-all ${
                isSelected
                  ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold leading-tight text-gray-900">{size}</span>
                {isSelected && (
                  <svg className="h-3 w-3 shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <p className="text-[10px] leading-tight text-gray-400">{info.size}</p>
              <p className="text-[11px] font-semibold leading-tight text-gray-900">{formatCurrency(info.price)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );

  const mediaInfoSection = (
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
        {isVideo ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
        {isVideo ? 'Video Information' : 'Image Information'}
      </h3>

      {isVideo ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Quality</p>
              <p className="text-sm font-semibold text-gray-900">{product.videoInfo.quality}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">FPS</p>
              <p className="text-sm font-semibold text-gray-900">{product.videoInfo.fps}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">File Size</p>
              <p className="text-sm font-semibold text-gray-900">{product.videoInfo.size}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Duration</p>
              <p className="text-sm font-semibold text-gray-900">{product.videoInfo.duration}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Format</span>
              <span className="font-medium text-gray-900">{product.videoInfo.format}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Max Quality</p>
            <p className="text-sm font-semibold text-gray-900">{product.videoInfo?.quality || '4K'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">File Size</p>
            <p className="text-sm font-semibold text-gray-900">{product.videoInfo?.size || '—'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 sm:col-span-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Format</p>
            <p className="text-sm font-semibold text-gray-900">{product.videoInfo?.format || 'JPEG / PNG'}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          back
        </button>

        <div className="grid items-start gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          <div className="relative order-first h-fit lg:sticky lg:top-8 lg:self-start">
            <ProductMediaGallery product={product} />
          </div>

          <div className="flex flex-col space-y-6 lg:space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {product.brand && (
                  <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    {product.brand}
                  </span>
                )}
                <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {isVideo ? 'Video' : 'Image'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                {nameWords.map((word, idx) => (
                  <span key={idx} className="inline-block mr-2">{word}</span>
                ))}
              </h1>
              <p className="text-sm text-gray-500">
                {product.category} {getProductTypeLabel(product)}
              </p>
            </div>

            <div className="flex items-baseline gap-3 pb-4 border-b border-gray-200">
              <span className="text-3xl lg:text-4xl font-bold text-gray-900">{formatCurrency(finalPrice)}</span>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">{product.description}</p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl active:scale-[0.98] sm:px-6 sm:text-base"
              >                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Add to Cart</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-gray-900 bg-white px-4 py-3.5 text-sm font-semibold text-gray-900 shadow-md transition-all hover:bg-gray-50 hover:shadow-lg active:scale-[0.98] sm:px-6 sm:text-base"
              >                <span>Buy Now</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 lg:hidden">
              {resolutionSection}
              {mediaInfoSection}
            </div>

            <div className="hidden lg:block space-y-4">
              {resolutionSection}
              {mediaInfoSection}
            </div>
          </div>
        </div>

        <div className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-gray-200 mb-12 sm:mb-20">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-6">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4">            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
