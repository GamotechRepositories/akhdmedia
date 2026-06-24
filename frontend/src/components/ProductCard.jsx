import { memo } from 'react';
import { Link } from 'react-router-dom';
import {
  getProductBadgeLabel,
  isVideoProduct,
} from '../constants/mediaTypes';
import { formatQualityBadgeLabel, getHighestQualityLabel } from '../constants/imageSizes';
import { formatCurrency } from '../utils/formatters';
import ProductThumbnail from './ui/ProductThumbnail';
import { IconPlay } from './icons/Icons';
import { preventMediaContextMenu } from '../utils/mediaProtection';

const THUMB_WIDTH = { compact: 400, default: 520 };
const THUMB_HEIGHT = { compact: 500, default: 650 };

const badgeTextClass =
  'text-[length:clamp(0.4375rem,8cqw,0.625rem)] tracking-[0.04em]';

const ProductCard = ({ product, compact = false }) => {
  const isVideo = isVideoProduct(product);
  const finalPrice = product.price || 0;
  const qualityLabel = formatQualityBadgeLabel(
    getHighestQualityLabel(product) ??
      product.videoInfo?.quality?.split(' ')[0] ??
      'HD',
  );

  return (
    <article className="@container group relative w-full min-w-0 translate-z-0 transform-gpu select-none [content-visibility:auto] [contain-intrinsic-size:auto_320px]">
      <Link to={`/product/${product.id}`} className="block">
        <div
          className="protected-media-shell relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-gray-100 shadow-sm @[220px]:rounded-xl"
          onContextMenu={preventMediaContextMenu}
        >
          <span
            className={`absolute left-[5%] top-[5%] z-20 max-w-[40%] truncate rounded-md bg-black/80 px-[0.45em] py-[0.28em] font-bold uppercase text-white ${badgeTextClass}`}
          >
            {getProductBadgeLabel(product)}
          </span>

          <span
            className={`absolute right-[5%] top-[5%] z-20 flex max-w-[46%] items-center gap-[0.2em] truncate rounded-md bg-black/70 px-[0.45em] py-[0.28em] font-bold uppercase text-white ${badgeTextClass}`}
          >
            {isVideo && <IconPlay className="h-[1.15em] w-[1.15em] shrink-0" />}
            <span className="truncate">{qualityLabel}</span>
          </span>

          <ProductThumbnail
            product={product}
            alt={product.name}
            width={THUMB_WIDTH[compact ? 'compact' : 'default']}
            height={THUMB_HEIGHT[compact ? 'compact' : 'default']}
            quality={75}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />

          {isVideo && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="flex h-[clamp(2rem,22cqw,3rem)] w-[clamp(2rem,22cqw,3rem)] items-center justify-center rounded-full bg-white/95 opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                <IconPlay className="ml-0.5 h-[42%] w-[42%] text-gray-900" />
              </div>
            </div>
          )}

          <div className="absolute inset-x-[5%] bottom-[5%] z-20">
            <div className="flex min-h-[clamp(1.75rem,17cqw,3rem)] items-center justify-between gap-1 rounded-md bg-white/95 px-[0.45em] py-[0.2em] shadow-[0_4px_12px_rgba(0,0,0,0.1)] @[220px]:rounded-lg @[220px]:px-[0.55em]">
              <span className="min-w-0 truncate text-[length:clamp(0.6875rem,10cqw,1rem)] font-bold leading-none text-gray-900">
                {formatCurrency(finalPrice)}
              </span>
              <span className="flex h-[clamp(1.5rem,14cqw,2.5rem)] shrink-0 items-center gap-[0.25em] rounded-md bg-black px-[0.45em] font-bold uppercase text-white @[200px]:px-[0.65em] text-[length:clamp(0.4375rem,7cqw,0.75rem)]">
                <span className="hidden @[200px]:inline">
                  {isVideo ? 'Preview' : 'View'}
                </span>
                {isVideo ? (
                  <IconPlay className="h-[1.1em] w-[1.1em] shrink-0" />
                ) : (
                  <svg className="h-[1.1em] w-[1.1em] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-[0.65em] px-[0.1em]">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <h3
                className={`font-medium leading-snug text-gray-900 text-[length:clamp(0.6875rem,9cqw,0.875rem)] ${
                  compact ? 'line-clamp-2' : 'line-clamp-2 @[280px]:line-clamp-1'
                }`}
              >
                {product.name}
              </h3>
              <p className="mt-0.5 truncate text-[length:clamp(0.5625rem,7.5cqw,0.75rem)] text-gray-500">
                {product.category} · {getProductBadgeLabel(product)}
              </p>
            </div>
            <div className="flex shrink-0 items-center rounded bg-gray-50 px-[0.35em] py-[0.15em] text-[length:clamp(0.5rem,6.5cqw,0.625rem)] font-bold text-gray-600">
              40 sec
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default memo(ProductCard, (prev, next) =>
  prev.product.id === next.product.id && prev.compact === next.compact,
);
