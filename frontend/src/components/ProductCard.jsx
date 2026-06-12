import { memo } from 'react';
import { Link } from 'react-router-dom';
import {
  getProductBadgeLabel,
  isVideoProduct,
} from '../constants/mediaTypes';
import { getHighestQualityLabel } from '../constants/imageSizes';
import { formatCurrency } from '../utils/formatters';
import OptimizedImage from './ui/OptimizedImage';
import { IconPlay } from './icons/Icons';
import { preventMediaContextMenu } from '../utils/mediaProtection';

const THUMB_WIDTH = { compact: 400, default: 520 };
const THUMB_HEIGHT = { compact: 500, default: 650 };

const ProductCard = ({ product, compact = false }) => {
  const isVideo = isVideoProduct(product);
  const finalPrice = product.price || 0;
  const poster = product.images?.[0] || product.videoPoster;
  const qualityLabel =
    getHighestQualityLabel(product) ??
    product.videoInfo?.quality?.split(' ')[0] ??
    'HD';

  return (
    <article className="group relative w-full min-w-0 translate-z-0 transform-gpu select-none [content-visibility:auto] [contain-intrinsic-size:auto_320px]">
      <Link to={`/product/${product.id}`} className="block">
        <div
          className="protected-media-shell relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-100 shadow-sm"
          onContextMenu={preventMediaContextMenu}
        >
          <span className={`absolute left-2 top-2 z-20 rounded-md bg-black/80 font-bold uppercase tracking-wide text-white ${compact ? 'px-1.5 py-0.5 text-[9px]' : 'left-3 top-3 px-2 py-1 text-[10px]'}`}>
            {getProductBadgeLabel(product)}
          </span>

          <span className={`absolute right-2 top-2 z-20 flex items-center gap-1 rounded-md bg-black/70 font-bold uppercase tracking-wide text-white ${compact ? 'px-1.5 py-0.5 text-[9px]' : 'right-3 top-3 px-2 py-1 text-[10px]'}`}>
            {isVideo && <IconPlay className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} />}
            {qualityLabel}
          </span>

          <OptimizedImage
            src={poster}
            alt={product.name}
            width={THUMB_WIDTH[compact ? 'compact' : 'default']}
            height={THUMB_HEIGHT[compact ? 'compact' : 'default']}
            quality={75}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {isVideo && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                <IconPlay className="ml-0.5 h-5 w-5 text-gray-900" />
              </div>
            </div>
          )}

          <div className={`absolute z-20 ${compact ? 'inset-x-1.5 bottom-2' : 'inset-x-2 bottom-3 sm:inset-x-4'}`}>
            <div className={`flex items-center justify-between rounded-lg bg-white/95 shadow-[0_4px_12px_rgba(0,0,0,0.1)] ${compact ? 'h-9 pl-2 pr-1' : 'h-10 pl-3 pr-1 sm:h-12'}`}>
              <div className="flex flex-col justify-center leading-none">
                <span className={`font-bold text-gray-900 ${compact ? 'text-xs' : 'text-sm sm:text-base'}`}>
                  {formatCurrency(finalPrice)}
                </span>
              </div>
              <span className={`flex items-center gap-1 rounded-md bg-black font-bold uppercase tracking-wide text-white ${compact ? 'h-7 px-2 text-[9px]' : 'h-8 px-3 text-[10px] sm:h-10 sm:px-5 sm:text-xs'}`}>
                {!compact && <span className="hidden lg:block">{isVideo ? 'Preview' : 'View'}</span>}
                {isVideo ? (
                  <IconPlay className="h-3 w-3" />
                ) : (
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className={`px-1 ${compact ? 'mt-2' : 'mt-3'}`}>
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <h3 className={`line-clamp-2 font-medium leading-snug text-gray-900 ${compact ? 'text-xs' : 'line-clamp-1 text-sm'}`}>
                {product.name}
              </h3>
              <p className={`mt-0.5 truncate text-gray-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {product.category} · {getProductBadgeLabel(product)}
              </p>
            </div>
            {!compact && product.rating > 0 && (
              <div className="hidden items-center gap-1 rounded bg-gray-50 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 sm:flex">
                <span>★</span>
                <span>{product.rating}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
};

export default memo(ProductCard, (prev, next) =>
  prev.product.id === next.product.id && prev.compact === next.compact,
);
