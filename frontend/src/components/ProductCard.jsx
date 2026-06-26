import { memo } from 'react';
import { Link } from 'react-router-dom';
import {
  getProductBadgeLabel,
  getProductTypeLabel,
  isVideoProduct,
} from '../constants/mediaTypes';
import { formatQualityBadgeLabel, getHighestQualityLabel } from '../constants/imageSizes';
import ProductThumbnail from './ui/ProductThumbnail';
import { IconPlay } from './icons/Icons';
import { preventMediaContextMenu } from '../utils/mediaProtection';

const THUMB_WIDTH = { compact: 400, default: 520 };
const THUMB_HEIGHT = { compact: 500, default: 650 };

const badgeTextClass =
  'text-[length:clamp(7px,4.2cqw,10px)] leading-none tracking-[0.03em]';

const badgeShellClass =
  'rounded bg-black/85 font-bold uppercase text-white shadow-sm';

const badgePadClass = 'px-[0.3em] py-[0.14em]';

const ProductCard = ({ product, compact = false }) => {
  const isVideo = isVideoProduct(product);
  const qualityLabel = formatQualityBadgeLabel(
    getHighestQualityLabel(product) ??
      product.videoInfo?.quality?.split(' ')[0] ??
      'HD',
  );

  return (
    <article className="@container group relative w-full min-w-0 translate-z-0 transform-gpu select-none [content-visibility:auto] [contain-intrinsic-size:auto_320px]">
      <Link to={`/product/${product.id}`} className="block">
        <div
          className="protected-media-shell relative aspect-[4/5] w-full overflow-hidden rounded-lg bg-gray-900 shadow-sm @[220px]:rounded-xl"
          onContextMenu={preventMediaContextMenu}
        >
          <span
            className={`absolute left-1.5 top-1.5 z-20 max-w-[46%] truncate sm:left-[4%] sm:top-[4%] sm:max-w-[50%] ${badgeShellClass} ${badgePadClass} ${badgeTextClass}`}
          >
            {isVideo ? (
              <>
                <span className="sm:hidden">Video</span>
                <span className="hidden sm:inline">Stock Video</span>
              </>
            ) : (
              getProductBadgeLabel(product)
            )}
          </span>

          <span
            className={`absolute right-1.5 top-1.5 z-20 flex max-w-[40%] items-center gap-[0.15em] truncate sm:right-[4%] sm:top-[4%] ${badgeShellClass} bg-black/75 ${badgePadClass} ${badgeTextClass}`}
          >
            {isVideo && <IconPlay className="hidden h-[0.85em] w-[0.85em] shrink-0 sm:inline-block" />}
            <span className="truncate">{qualityLabel}</span>
          </span>

          <ProductThumbnail
            product={product}
            alt={product.name}
            width={THUMB_WIDTH[compact ? 'compact' : 'default']}
            height={THUMB_HEIGHT[compact ? 'compact' : 'default']}
            quality={75}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />

          {isVideo && (
            <>
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                <div className="flex h-[clamp(1.5rem,12cqw,2.5rem)] w-[clamp(1.5rem,12cqw,2.5rem)] items-center justify-center rounded-full bg-white/90 shadow-[0_6px_18px_rgba(0,0,0,0.3)] ring-1 ring-white/60 transition-all duration-300 group-hover:scale-105 group-hover:bg-white sm:ring-2">
                  <IconPlay className="ml-0.5 h-[38%] w-[38%] text-gray-900" />
                </div>
              </div>
            </>
          )}

          <div className="absolute bottom-1.5 right-1.5 z-20 max-w-[58%] sm:bottom-[4%] sm:right-[4%]">
            <div
              className={`inline-flex max-w-full items-center gap-[0.15em] ${badgeShellClass} bg-black/90 ${badgePadClass} ${badgeTextClass}`}
            >
              {isVideo ? (
                <>
                  <IconPlay className="h-[0.8em] w-[0.8em] shrink-0 text-white" />
                  <span className="truncate text-white">
                    <span className="sm:hidden">Play</span>
                    <span className="hidden sm:inline">Preview</span>
                  </span>
                </>
              ) : (
                <>
                  <svg className="h-[0.8em] w-[0.8em] shrink-0 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="truncate text-white">
                    <span className="sm:hidden">View</span>
                    <span className="hidden sm:inline">View Image</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-[0.55em] px-[0.1em]">
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
                {product.category} · {getProductTypeLabel(product)}
              </p>
            </div>
            {isVideo && product.videoInfo?.duration && (
              <div className="flex shrink-0 items-center gap-0.5 rounded bg-gray-900 px-[0.32em] py-[0.12em] text-[length:clamp(7px,4cqw,10px)] font-bold leading-none text-white">
                <IconPlay className="h-[0.8em] w-[0.8em]" />
                {product.videoInfo.duration}
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
