export const MEDIA_TYPES = {
  VIDEO: 'video',
  IMAGE: 'image',
};

export const isVideoProduct = (product) =>
  (product?.mediaType ?? MEDIA_TYPES.VIDEO) === MEDIA_TYPES.VIDEO;

export const isImageProduct = (product) =>
  product?.mediaType === MEDIA_TYPES.IMAGE;

export const getProductTypeLabel = (product) =>
  isVideoProduct(product) ? 'Video Footage' : 'Stock Image';

export const getProductBadgeLabel = (product) =>
  isVideoProduct(product) ? 'Video' : 'Image';

export const buildProductMediaItems = (product) => {
  const images = (product?.images ?? [])
    .filter(Boolean)
    .map((src, index) => ({
      type: 'image',
      src,
      label: `Image ${index + 1}`,
    }));

  if (!isVideoProduct(product) || !product.demoVideo) {
    return images;
  }

  return [
    {
      type: 'video',
      src: product.demoVideo,
      poster: (product?.images ?? []).find(Boolean) || product?.videoPoster || undefined,
      label: 'Demo Video',
    },
    ...images,
  ];
};

export const getResolutionSectionCopy = (product) =>
  isVideoProduct(product)
    ? {
        title: 'Video & Image Resolution',
        subtitle:
          'Choose quality for your video clip and still image downloads.',
      }
    : {
        title: 'Image Resolution',
        subtitle: 'Choose the download quality for your licensed image files.',
      };

export const getWhatsIncludedCopy = (product, selectedImageSize, sizeList) => {
  if (isVideoProduct(product)) {
    return [
      `${selectedImageSize} video file (${product.videoInfo?.quality || '4K'})`,
      `3 high-resolution still images at ${selectedImageSize} (${sizeList} available)`,
      'Commercial license included',
    ];
  }

  return [
    `${product.images?.length || 0} licensed image file(s) at ${selectedImageSize}`,
    `Available resolutions: ${sizeList}`,
    'Commercial license included',
  ];
};
