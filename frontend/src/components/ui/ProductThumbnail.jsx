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
    return (
      <VideoThumbnail
        src={media.src}
        alt={alt || product?.name || 'Video preview'}
        className={className}
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
