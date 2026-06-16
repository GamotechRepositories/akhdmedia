import { isVideoProduct } from '../constants/mediaTypes';

export const getProductPosterUrl = (product) => {
  const image = (product?.images ?? []).find(Boolean);
  if (image) return image;
  if (product?.videoPoster) return product.videoPoster;
  return '';
};

export const getProductVideoSource = (product) => {
  if (!isVideoProduct(product)) return '';
  return product?.demoVideo?.trim() || '';
};

export const getProductCardMedia = (product) => {
  const poster = getProductPosterUrl(product);
  if (poster) {
    return { type: 'image', src: poster };
  }

  const videoSrc = getProductVideoSource(product);
  if (videoSrc) {
    return { type: 'video', src: videoSrc };
  }

  return { type: 'image', src: '' };
};
