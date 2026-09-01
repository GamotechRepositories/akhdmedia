import { optimizeImageUrl } from '../../utils/optimizeImageUrl';
import { handleImageError } from '../../utils/imageFallback';
import {
  PROTECTED_MEDIA_CLASS,
  getProtectedImageProps,
} from '../../utils/mediaProtection';

const OptimizedImage = ({
  src,
  alt = '',
  width,
  height,
  quality = 75,
  className = '',
  style,
  loading = 'lazy',
  decoding = 'async',
  fetchPriority,
  onError,
  protected: isProtected = true,
}) => {
  const protectedProps = isProtected ? getProtectedImageProps() : { draggable: false };

  return (
    <img
      src={optimizeImageUrl(src, { width, height, quality })}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      style={style}
      className={`${isProtected ? PROTECTED_MEDIA_CLASS : ''} ${className}`.trim()}
      onError={onError ?? ((e) => handleImageError(e, width, height))}
      {...protectedProps}
    />
  );
};

export default OptimizedImage;
