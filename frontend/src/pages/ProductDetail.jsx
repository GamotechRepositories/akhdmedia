import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import ProductMediaGallery from '../components/product/ProductMediaGallery';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import { useCatalog } from '../context/CatalogContext';
import { BRAND } from '../config/brand';
import {
  getDefaultImageSize,
  sortImageSizeEntries,
} from '../constants/imageSizes';
import {
  getProductTypeLabel,
  isVideoProduct,
} from '../constants/mediaTypes';
import { PURCHASE_UNAVAILABLE_MESSAGE } from '../constants/purchase';
import { formatCurrency } from '../utils/formatters';

const SpecItem = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-0.5 text-xs font-semibold text-gray-900 sm:text-sm">{value}</p>
  </div>
);

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { getProductById, getRelatedProducts, loading: catalogLoading } = useCatalog();
  const { addToCart, buyNow } = useCart();
  const { isAuthenticated } = useAuth();
  const { success, error: showError } = useToast();
  const processedAuthIntentRef = useRef(false);

  const [product, setProduct] = useState(null);
  const [selectedImageSize, setSelectedImageSize] = useState('');
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  useEffect(() => {
    const found = getProductById(id);
    setProduct(found);
    setSelectedImageSize(found ? getDefaultImageSize(found.imageSizes) : '');
  }, [id, getProductById, catalogLoading]);

  useEffect(() => {
    const intent = location.state?.afterLoginAction;

    if (!intent || !isAuthenticated || !product || processedAuthIntentRef.current) {
      return;
    }

    if (intent.productId !== product.id) {
      return;
    }

    processedAuthIntentRef.current = true;

    const runIntent = async () => {
      try {
        if (intent.type === 'addToCart') {
          await addToCart(product, 1, intent.imageSize || selectedImageSize);
          success('Added to cart');
          navigate(location.pathname, { replace: true, state: null });
          return;
        }

        if (intent.type === 'buyNow') {
          await buyNow(product, 1, intent.imageSize || selectedImageSize);
          navigate('/checkout');
          return;
        }
      } catch (actionError) {
        showError(actionError.message || 'Could not continue after login');
      }

      navigate(location.pathname, { replace: true, state: null });
    };

    runIntent();
  }, [
    addToCart,
    buyNow,
    isAuthenticated,
    location.pathname,
    location.state,
    navigate,
    product,
    selectedImageSize,
    showError,
    success,
  ]);

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-center text-white">
        <h1 className="mb-2 text-2xl font-bold">Clip Not Found</h1>
        <p className="mb-6 text-gray-400">This footage may have been removed from the library.</p>
        <Link to="/videos" className="rounded-lg bg-white px-8 py-3 font-medium text-gray-900 hover:bg-gray-100">
          Browse Footage
        </Link>
      </div>
    );
  }

  const isVideo = isVideoProduct(product);
  const isPurchasable = Boolean(product.isPurchasable);
  const relatedProducts = getRelatedProducts(product.id);
  const resolutionEntries = sortImageSizeEntries(product.imageSizes);
  const [lowestTierName, lowestTierInfo] = resolutionEntries[0] || [];
  const listingPrice = lowestTierInfo?.price ?? product.price;
  const selectedTierInfo = product.imageSizes?.[selectedImageSize] || lowestTierInfo || null;
  const displayTierName = selectedImageSize || lowestTierName || '—';
  const displayPrice = selectedTierInfo?.price ?? listingPrice;
  const licenseIncludedLabel = product.videoInfo?.orientationNote?.trim() || '';

  const openUnavailableModal = () => setShowUnavailableModal(true);

  const redirectToLogin = (actionType) => {
    showError('Please sign in to continue');
    navigate('/login', {
      state: {
        from: `/product/${id}`,
        afterLoginAction: {
          type: actionType,
          productId: id,
          imageSize: selectedImageSize,
        },
      },
    });
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      redirectToLogin('addToCart');
      return;
    }

    if (!isPurchasable) {
      openUnavailableModal();
      return;
    }

    try {
      await addToCart(product, 1, selectedImageSize);
      success('Added to cart');
    } catch (error) {
      showError(error.message || 'Could not add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      redirectToLogin('buyNow');
      return;
    }

    if (!isPurchasable) {
      openUnavailableModal();
      return;
    }

    try {
      await buyNow(product, 1, selectedImageSize);
      navigate('/checkout');
    } catch (error) {
      showError(error.message || 'Could not start checkout');
    }
  };

  const specItems = isVideo
    ? [
        { label: 'Quality', value: product.videoInfo?.quality },
        { label: 'Frame rate', value: product.videoInfo?.fps },
        { label: 'Duration', value: product.videoInfo?.duration },
        { label: 'Master size', value: product.videoInfo?.size },
        { label: 'Format', value: product.videoInfo?.format },
      ].filter((item) => item.value)
    : [
        { label: 'Quality', value: product.videoInfo?.quality },
        { label: 'File size', value: product.videoInfo?.size },
        { label: 'Format', value: product.videoInfo?.format || 'JPEG / PNG' },
      ].filter((item) => item.value);

  return (
    <div className="min-h-screen bg-[#f4f5f7]">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 transition hover:text-gray-900"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
            {BRAND.tagline}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-8">
          <div className="lg:sticky lg:top-6 lg:self-start">
            <ProductMediaGallery product={product} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 px-5 py-5 text-white sm:px-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {product.brand && (
                  <span className="rounded-full bg-amber-400/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-900">
                    {product.brand}
                  </span>
                )}
                <span className="rounded-full bg-amber-400/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-900">
                  {isVideo ? 'Stock Video' : 'Stock Image'}
                </span>
                {isVideo && product.videoInfo?.duration && (
                  <span className="rounded-full bg-amber-400/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-900">
                    {product.videoInfo.duration}
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold leading-snug sm:text-2xl lg:text-[1.65rem]">
                {product.name}
              </h1>
              {product.clipId && (
                <p className="mt-1 font-mono text-xs text-white/55">Clip ID · {product.clipId}</p>
              )}
              <p className="mt-1.5 text-sm text-white/65">
                {product.category} · {getProductTypeLabel(product)}
              </p>
              {product.description && (
                <p className="mt-3 text-sm leading-relaxed text-white/75">{product.description}</p>
              )}

              <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-white/10 pt-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                    License from · {displayTierName}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">{formatCurrency(displayPrice)}</p>
                </div>
                {lowestTierInfo && (
                  <div className="text-right text-xs text-white/70">
                    {licenseIncludedLabel && (
                      <p className="mt-0.5 text-white/50">{licenseIncludedLabel}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 px-5 py-4 sm:px-6">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold shadow-md transition active:scale-[0.99] ${
                    isPurchasable
                      ? 'bg-gray-900 text-white hover:bg-gray-800'
                      : 'cursor-not-allowed bg-gray-400 text-white shadow-none'
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3.5 text-sm font-semibold transition active:scale-[0.99] ${
                    isPurchasable
                      ? 'border-gray-900 bg-white text-gray-900 hover:bg-gray-50'
                      : 'cursor-not-allowed border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  Download & Licensed
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
              {!isAuthenticated && isPurchasable && (
                <p className="text-center text-xs text-gray-500">
                  To continue, please login or create account.
                </p>
              )}
            </div>

            <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 sm:px-6">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wide text-gray-900">
                  Select download quality
                </h3>
                <span className="text-[10px] font-medium text-gray-500">
                  {isVideo ? 'Video + stills' : 'Licensed file'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {resolutionEntries.map(([size, info]) => {
                  const isSelected = selectedImageSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedImageSize(size)}
                      className={`relative rounded-xl border px-3 py-2.5 text-left transition ${
                        isSelected
                          ? 'border-gray-900 bg-gray-900 text-white shadow-md ring-2 ring-gray-900/20'
                          : 'border-gray-200 bg-white text-gray-900 hover:border-gray-400 hover:shadow-sm'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-gray-900">
                          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                      <p className="pr-5 text-sm font-bold">{size}</p>
                      <p className={`mt-0.5 text-[10px] ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                        {info.size}
                      </p>
                      <p className={`mt-1 text-xs font-bold ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                        {formatCurrency(info.price)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {specItems.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-100 px-5 py-4 sm:px-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-900">
                  {isVideo ? 'Clip specifications' : 'File details'}
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                  {specItems.map((item) => (
                    <SpecItem key={item.label} label={item.label} value={item.value} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-10 border-t border-gray-200 pt-8 sm:mt-12">
            <h2 className="mb-5 text-lg font-bold text-gray-900 sm:text-xl">More like this</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {showUnavailableModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unavailable-title"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-6 w-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 id="unavailable-title" className="text-center text-lg font-bold text-gray-900">
              Video Not Available
            </h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-gray-600">
              {PURCHASE_UNAVAILABLE_MESSAGE}
            </p>
            <button
              type="button"
              onClick={() => setShowUnavailableModal(false)}
              className="mt-6 w-full rounded-xl bg-gray-900 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
