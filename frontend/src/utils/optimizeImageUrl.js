const UNSPLASH_HOSTS = ['images.unsplash.com', 'unsplash.com'];

const isUnsplash = (hostname) =>
  UNSPLASH_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`));

export const optimizeImageUrl = (url, { width, height, quality = 75 } = {}) => {
  if (!url || typeof url !== 'string') return url;

  try {
    const parsed = new URL(url);

    if (isUnsplash(parsed.hostname)) {
      if (width) parsed.searchParams.set('w', String(width));
      if (height) parsed.searchParams.set('h', String(height));
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('q', String(quality));
      return parsed.toString();
    }

    if (parsed.hostname.includes('cloudinary.com') && parsed.pathname.includes('/upload/')) {
      const [prefix, rest] = parsed.pathname.split('/upload/');
      if (!rest) return url;

      const segments = rest.split('/');
      const hasTransforms = segments[0]?.includes(',') || segments[0]?.startsWith('v');
      const assetPath = hasTransforms && segments[0]?.includes(',')
        ? segments.slice(1).join('/')
        : rest;

      const transforms = [
        'f_auto',
        `q_auto:${quality}`,
        width ? `w_${width}` : null,
        height ? `h_${height}` : null,
        'c_fill',
      ]
        .filter(Boolean)
        .join(',');

      parsed.pathname = `${prefix}/upload/${transforms}/${assetPath}`;
      return parsed.toString();
    }

    return url;
  } catch {
    return url;
  }
};
