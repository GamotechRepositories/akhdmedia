export const getPlaceholderImage = (width = 400, height = 400) => {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle" dy=".3em">No Image</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const handleImageError = (e, width = 400, height = 400) => {
  if (e.target.src?.startsWith('data:image/svg+xml')) return;
  e.target.onerror = null;
  e.target.src = getPlaceholderImage(width, height);
};
