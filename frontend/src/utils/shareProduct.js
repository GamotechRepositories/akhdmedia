const resolveAbsoluteUrl = (path = '') => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).href;
};

export const getShareBaseUrl = () => {
  const explicit = import.meta.env.VITE_SHARE_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  const apiUrl = import.meta.env.VITE_API_URL?.trim() || '';
  if (/^https?:\/\//i.test(apiUrl)) {
    return apiUrl.replace(/\/api\/?$/, '');
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:5001`;
  }

  return '';
};

export const buildProductShareUrl = (product) =>
  `${getShareBaseUrl()}/share/product/${product.id}`;

export const buildProductPageUrl = (product) =>
  resolveAbsoluteUrl(`/product/${product.id}`);

export const shareProduct = async (product) => {
  const shareUrl = buildProductShareUrl(product);
  const shareData = {
    title: product.name,
    text: product.name,
    url: shareUrl,
  };

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(shareData);
      return { method: 'native' };
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw error;
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(shareUrl);
    return { method: 'clipboard' };
  }

  throw new Error('Sharing is not supported on this device');
};
