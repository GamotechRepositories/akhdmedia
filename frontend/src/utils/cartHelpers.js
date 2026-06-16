import { getProductPosterUrl, getProductVideoSource } from './productMedia';
import { isVideoProduct } from '../constants/mediaTypes';

export const getCartItemPrice = (item) => {
  if (item.price != null) return item.price;
  const product = item.product || item;
  if (item.imageSize && product.imageSizes?.[item.imageSize]) {
    return product.imageSizes[item.imageSize].price;
  }
  return product.price || 0;
};

export const getCartItemImage = (item) => {
  const product = item.product || item;
  const poster = getProductPosterUrl(product);
  if (poster) return poster;
  if (isVideoProduct(product)) return getProductVideoSource(product);
  return product.thumbnail || '';
};

export const buildCartItemKey = (productId, imageSize = '') =>
  `${productId}::${imageSize || 'default'}`;
