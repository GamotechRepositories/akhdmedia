const resolveAbsoluteUrl = (path = '') => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).href;
};

export const buildProductShareUrl = (product) =>
  resolveAbsoluteUrl(`/product/${product.id}`);

export const shareProduct = async (product) => {
  const url = buildProductShareUrl(product);

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ url });
      return { method: 'native' };
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw error;
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return { method: 'clipboard' };
  }

  throw new Error('Sharing is not supported on this device');
};
