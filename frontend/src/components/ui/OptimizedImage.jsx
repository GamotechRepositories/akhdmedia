import { optimizeImageUrl } from '../../utils/optimizeImageUrl';
import { handleImageError } from '../../utils/imageFallback';

const OptimizedImage = ({
  src,
  alt = '',
  width,
  height,
  quality = 75,
  className,
  loading = 'lazy',
  fetchPriority,
  onError,
}) => (
  <img
    src={optimizeImageUrl(src, { width, height, quality })}
    alt={alt}
    width={width}
    height={height}
    loading={loading}
    decoding="async"
    fetchPriority={fetchPriority}
    draggable={false}
    className={className}
    onError={onError ?? ((e) => handleImageError(e, width, height))}
  />
);

export default OptimizedImage;
