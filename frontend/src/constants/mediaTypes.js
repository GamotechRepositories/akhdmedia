export const MEDIA_TYPES = {
  VIDEO: 'video',
  IMAGE: 'image',
};

export const isVideoProduct = (product) =>
  (product?.mediaType ?? MEDIA_TYPES.VIDEO) === MEDIA_TYPES.VIDEO;

export const isYoutubeDemoProduct = (product) =>
  isVideoProduct(product) && (product?.demoVideoSource || 's3') === 'youtube';

export const getYoutubePreviewPosterUrl = (product) => {
  const previewOne = product?.images?.[0]?.trim();
  if (previewOne) return previewOne;
  // Admin syncs Preview Image 1 into videoPoster on save
  return product?.videoPoster?.trim() || '';
};

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

  if (!isVideoProduct(product)) {
    return images;
  }

  const demoSource = product?.demoVideoSource || 's3';

  const previewImageOne = getYoutubePreviewPosterUrl(product);
  const poster =
    demoSource === 'youtube'
      ? previewImageOne || undefined
      : (product?.images ?? []).find(Boolean) || product?.videoPoster || undefined;

  if (demoSource === 'youtube' && product?.demoVideoYoutubeUrl?.trim()) {
    return [
      {
        type: 'youtube',
        src: product.demoVideoYoutubeUrl.trim(),
        poster,
        label: 'YouTube Short',
      },
      ...images,
    ];
  }

  if (product.demoVideo) {
    return [
      {
        type: 'video',
        src: product.demoVideo,
        poster,
        label: 'Demo Video',
      },
      ...images,
    ];
  }

  return images;
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
