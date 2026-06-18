import { getProductPosterUrl, getProductVideoSource } from './productMedia';
import { isVideoProduct } from '../constants/mediaTypes';

export const getCartItemPrice = (item) => {
  if (item.price != null) return item.price;
  const product = item.product || item;
  if (item.imageSize && product.imageSizes?.[item.imageSize]) {
    const basePrice = product.imageSizes[item.imageSize].price;
    return basePrice + (basePrice * (Number(product.gstPercentage) || 0)) / 100;
  }
  return (product.price || 0) + ((product.price || 0) * (Number(product.gstPercentage) || 0)) / 100;
};

export const getCartItemBasePrice = (item) => {
  if (item.basePrice != null) return item.basePrice;
  const product = item.product || item;
  if (item.imageSize && product.imageSizes?.[item.imageSize]) {
    return product.imageSizes[item.imageSize].price || 0;
  }
  return product.price || 0;
};

export const getCartItemGstPercentage = (item) =>
  Number(item.gstPercentage ?? item.product?.gstPercentage ?? item.gstPercentage ?? 0) || 0;

export const getCartItemGstAmount = (item) => {
  if (item.gstAmount != null) return item.gstAmount;
  const basePrice = getCartItemBasePrice(item);
  return (basePrice * getCartItemGstPercentage(item)) / 100;
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
