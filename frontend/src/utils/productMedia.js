import {
  getYoutubePreviewPosterUrl,
  isVideoProduct,
  isYoutubeDemoProduct,
} from '../constants/mediaTypes';

export const getProductPosterUrl = (product) => {
  if (isYoutubeDemoProduct(product)) {
    return getYoutubePreviewPosterUrl(product);
  }

  const image = (product?.images ?? []).find(Boolean);
  if (image) return image;
  if (product?.videoPoster) return product.videoPoster;
  return '';
};

export const getProductVideoSource = (product) => {
  if (!isVideoProduct(product) || isYoutubeDemoProduct(product)) return '';
  return product?.demoVideo?.trim() || '';
};

export const getProductCardMedia = (product) => {
  if (isYoutubeDemoProduct(product)) {
    return { type: 'image', src: getYoutubePreviewPosterUrl(product) };
  }

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
