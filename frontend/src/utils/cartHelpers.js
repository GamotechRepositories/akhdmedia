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
  return product.images?.[0] || product.videoPoster || product.thumbnail || '';
};

export const buildCartItemKey = (productId, imageSize = '') =>
  `${productId}::${imageSize || 'default'}`;
