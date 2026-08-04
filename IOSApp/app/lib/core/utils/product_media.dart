import '../../models/product.dart';

class ProductMediaItem {
  const ProductMediaItem({
    required this.type,
    required this.src,
    required this.label,
    this.poster,
  });

  final String type;
  final String src;
  final String label;
  final String? poster;

  bool get isVideo => type == 'video';
  bool get isYoutube => type == 'youtube';
  bool get isPlayablePreview => isVideo || isYoutube;
}

List<ProductMediaItem> buildProductMediaItems(Product product) {
  final images = product.images
      .where((src) => src.trim().isNotEmpty)
      .toList()
      .asMap()
      .entries
      .map(
        (entry) => ProductMediaItem(
          type: 'image',
          src: entry.value,
          label: 'Image ${entry.key + 1}',
        ),
      )
      .toList();

  if (!product.isVideo) {
    return images;
  }

  final previewImageOne =
      product.images.isNotEmpty ? product.images[0].trim() : '';
  final resolvedPoster = product.demoVideoSource == 'youtube'
      ? (previewImageOne.isNotEmpty
          ? previewImageOne
          : (product.videoPoster.trim().isNotEmpty
              ? product.videoPoster.trim()
              : null))
      : _resolveS3PreviewPoster(product);

  if (product.demoVideoSource == 'youtube' &&
      product.demoVideoYoutubeUrl.trim().isNotEmpty) {
    return [
      ProductMediaItem(
        type: 'youtube',
        src: product.demoVideoYoutubeUrl.trim(),
        poster: resolvedPoster,
        label: 'YouTube Short',
      ),
      ...images,
    ];
  }

  if (product.demoVideo.trim().isEmpty) {
    return images;
  }

  return [
    ProductMediaItem(
      type: 'video',
      src: product.demoVideo,
      poster: resolvedPoster,
      label: 'Demo Video',
    ),
    ...images,
  ];
}

String? _resolveS3PreviewPoster(Product product) {
  for (final image in product.images) {
    if (image.trim().isNotEmpty) return image.trim();
  }
  if (product.videoPoster.trim().isNotEmpty) return product.videoPoster.trim();
  return null;
}
