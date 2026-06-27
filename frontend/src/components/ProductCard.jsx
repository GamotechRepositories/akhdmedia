import { memo } from 'react';
import { Link } from 'react-router-dom';
import {
  getProductBadgeLabel,
  getProductTypeLabel,
  isVideoProduct,
} from '../constants/mediaTypes';
import { formatQualityBadgeLabel, getHighestQualityLabel } from '../constants/imageSizes';
import ProductThumbnail from './ui/ProductThumbnail';
import { IconPlay, IconPreviewPlay } from './icons/Icons';
import { preventMediaContextMenu } from '../utils/mediaProtection';

const THUMB_WIDTH = { compact: 400, default: 520 };
const THUMB_HEIGHT = { compact: 500, default: 650 };

const badgeTextClass = 'text-[8px] leading-none tracking-[0.03em] sm:text-[9px]';

const badgeShellClass =
  'rounded bg-black/85 font-bold uppercase text-white shadow-sm';

const badgePadClass = 'px-[0.3em] py-[0.14em]';

const previewButtonClass =
  'min-h-[18px] px-1.5 py-0.5 sm:min-h-[22px] sm:px-2 sm:py-1';

const previewActionTextClass =
  'text-[8px] leading-none tracking-[0.04em] sm:text-[10px] md:text-[11px]';

const previewActionButtonClass =
  'min-h-[22px] px-2 py-1 sm:min-h-[26px] sm:px-6 sm:py-1.5 md:px-8';

const cardPillClass = `inline-flex items-center gap-0.5 ${badgeShellClass} ${previewButtonClass} ${badgeTextClass}`;

const previewActionPillClass = `inline-flex max-w-full items-center justify-center gap-1 sm:gap-1.5 sm:min-w-[9.5rem] md:min-w-[11rem] ${badgeShellClass} ${previewActionButtonClass} ${previewActionTextClass}`;

const cardPillIconClass = 'h-2 w-2 shrink-0 sm:h-2.5 sm:w-2.5';

const previewActionIconClass = 'h-3 w-3 shrink-0 sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]';

const ProductCard = ({ product, compact = false }) => {
  const isVideo = isVideoProduct(product);
  const qualityLabel = formatQualityBadgeLabel(
    getHighestQualityLabel(product) ??
      product.videoInfo?.quality?.split(' ')[0] ??
      'HD',
  );

  return (
    <article className="@container group relative w-full min-w-0 translate-z-0 transform-gpu select-none [content-visibility:auto] [contain-intrinsic-size:auto_360px]">
      <Link to={`/product/${product.id}`} className="block">
        <div
          className="protected-media-shell relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-900 shadow-sm @[220px]:rounded-xl"
          onContextMenu={preventMediaContextMenu}
        >
          {!isVideo && (
            <span
              className={`absolute left-1.5 top-1.5 z-20 max-w-[46%] truncate sm:left-[4%] sm:top-[4%] sm:max-w-[50%] ${badgeShellClass} ${badgePadClass} ${badgeTextClass}`}
            >
              {getProductBadgeLabel(product)}
            </span>
          )}

          <span
            className={`absolute right-1.5 top-1.5 z-20 max-w-[40%] truncate sm:right-[4%] sm:top-[4%] ${cardPillClass} bg-black/90`}
          >
            {isVideo && <IconPlay className={`hidden text-white sm:inline-block ${cardPillIconClass}`} />}
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

          <div className="absolute bottom-1.5 left-1/2 z-20 max-w-[85%] -translate-x-1/2 sm:bottom-[4%]">
            <div className={`${previewActionPillClass} bg-black/90`}>
              {isVideo ? (
                <>
                  <IconPreviewPlay className={`text-white ${previewActionIconClass}`} />
                  <span className="truncate font-bold uppercase text-white">Video Preview</span>
                </>
              ) : (
                <>
                  <svg className={`text-white ${previewActionIconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="truncate font-bold uppercase text-white">View Image</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-[0.55em] px-[0.1em]">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <h3
                className={`text-[11px] font-medium leading-snug text-gray-900 sm:text-sm ${
                  compact ? 'line-clamp-2' : 'line-clamp-2 @[280px]:line-clamp-1'
                }`}
              >
                {product.name}
              </h3>
              <p className="mt-0.5 truncate text-[10px] text-gray-500 sm:text-xs">
                {product.category} · {getProductTypeLabel(product)}
              </p>
            </div>
            {isVideo && product.videoInfo?.duration && (
              <div className={`shrink-0 ${cardPillClass} bg-black/90`}>
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
