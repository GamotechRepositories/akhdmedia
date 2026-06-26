import { BRAND } from '../config/brand';
import { getProductTypeLabel, isVideoProduct } from '../constants/mediaTypes';
import { formatCurrency } from './formatters';
import { getProductPosterUrl } from './productMedia';

const resolveAbsoluteUrl = (path = '') => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).href;
};

export const buildProductSharePayload = (product, { price } = {}) => {
  const productUrl = resolveAbsoluteUrl(`/product/${product.id}`);
  const imageUrl = resolveAbsoluteUrl(getProductPosterUrl(product));
  const mediaLabel = isVideoProduct(product) ? 'Stock Video' : 'Stock Image';
  const listingPrice = price ?? product.price;

  const detailLines = [
    product.clipId ? `Clip ID: ${product.clipId}` : null,
    `${product.category} · ${getProductTypeLabel(product)}`,
    product.videoInfo?.duration ? `Duration: ${product.videoInfo.duration}` : null,
    listingPrice != null ? `License from ${formatCurrency(listingPrice)}` : null,
  ].filter(Boolean);

  const text = [
    product.name,
    ...detailLines,
    '',
    `View on ${BRAND.name}:`,
    productUrl,
    imageUrl ? `\nPreview: ${imageUrl}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n');

  return {
    title: product.name,
    text,
    url: productUrl,
    imageUrl,
    mediaLabel,
  };
};

const tryShareWithImage = async (shareData, imageUrl) => {
  if (!imageUrl || !navigator.canShare) return false;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return false;

    const blob = await response.blob();
    const extension = blob.type?.split('/')[1] || 'jpg';
    const file = new File([blob], `akhd-${shareData.title.slice(0, 40).replace(/\s+/g, '-')}.${extension}`, {
      type: blob.type || 'image/jpeg',
    });
    const payload = { ...shareData, files: [file] };

    if (!navigator.canShare(payload)) return false;

    await navigator.share(payload);
    return true;
  } catch {
    return false;
  }
};

export const shareProduct = async (product, options = {}) => {
  const payload = buildProductSharePayload(product, options);
  const shareData = {
    title: payload.title,
    text: payload.text,
    url: payload.url,
  };

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      const sharedWithImage = await tryShareWithImage(shareData, payload.imageUrl);
      if (sharedWithImage) {
        return { method: 'native-image' };
      }

      await navigator.share(shareData);
      return { method: 'native' };
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw error;
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(payload.text);
    return { method: 'clipboard' };
  }

  throw new Error('Sharing is not supported on this device');
};
