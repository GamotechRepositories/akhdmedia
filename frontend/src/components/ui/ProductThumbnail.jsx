import { getProductCardMedia } from '../../utils/productMedia';
import OptimizedImage from './OptimizedImage';
import VideoThumbnail from './VideoThumbnail';

const ProductThumbnail = ({
  product,
  alt = '',
  width,
  height,
  quality = 75,
  loading = 'lazy',
  className = '',
}) => {
  const media = getProductCardMedia(product);

  if (media.type === 'video') {
    if (!media.src?.trim()) {
      return <div className={`bg-gray-900 ${className}`.trim()} aria-hidden />;
    }

    return (
      <VideoThumbnail
        src={media.src}
        alt={alt || product?.name || 'Video preview'}
        className={className}
      />
    );
  }

  if (!media.src?.trim()) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-900 ${className}`.trim()}
        aria-label={alt || product?.name || 'Product preview'}
      />
    );
  }

  return (
    <OptimizedImage
      src={media.src}
      alt={alt || product?.name || 'Product'}
      width={width}
      height={height}
      quality={quality}
      loading={loading}
      className={className}
    />
  );
};

export default ProductThumbnail;
