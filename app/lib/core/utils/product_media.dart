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

  if (!product.isVideo || product.demoVideo.trim().isEmpty) {
    return images;
  }

  final poster = product.images.firstWhere(
    (image) => image.trim().isNotEmpty,
    orElse: () => product.videoPoster,
  );

  return [
    ProductMediaItem(
      type: 'video',
      src: product.demoVideo,
      poster: poster.trim().isNotEmpty ? poster : null,
      label: 'Demo Video',
    ),
    ...images,
  ];
}
