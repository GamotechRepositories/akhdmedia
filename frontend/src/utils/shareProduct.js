const resolveAbsoluteUrl = (path = '') => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof window === 'undefined') return path;
  return new URL(path, window.location.origin).href;
};

export const getPublicSiteUrl = () => {
  const explicit =
    import.meta.env.VITE_SITE_URL?.trim() ||
    import.meta.env.VITE_SHARE_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
};

export const buildProductPageUrl = (product) => {
  const base = getPublicSiteUrl();
  const path = `/product/${product.id}`;
  return base ? `${base}${path}` : resolveAbsoluteUrl(path);
};

export const shareProduct = async (product) => {
  const shareUrl = buildProductPageUrl(product);
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
