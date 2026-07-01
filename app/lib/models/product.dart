import '../core/utils/image_sizes.dart';
import 'image_size_info.dart';

class Product {
  const Product({
    required this.id,
    required this.name,
    required this.mediaType,
    required this.category,
    required this.categorySlug,
    required this.subCategory,
    required this.clipId,
    required this.brand,
    required this.price,
    required this.description,
    required this.images,
    required this.demoVideo,
    required this.videoPoster,
    required this.isActive,
    required this.isPurchasable,
    this.imageSizes = const {},
    this.rating,
    this.videoInfo,
    this.actorId,
    this.actorName = '',
  });

  final String id;
  final String name;
  final String mediaType;
  final String category;
  final String categorySlug;
  final String subCategory;
  final String clipId;
  final String brand;
  final num price;
  final String description;
  final List<String> images;
  final String demoVideo;
  final String videoPoster;
  final bool isActive;
  final bool isPurchasable;
  final Map<String, ProductImageSize> imageSizes;
  final num? rating;
  final Map<String, dynamic>? videoInfo;
  final String? actorId;
  final String actorName;

  bool get isVideo => mediaType == 'video';

  String get thumbnailUrl {
    for (final image in images) {
      if (image.trim().isNotEmpty) return image;
    }
    if (videoPoster.trim().isNotEmpty) return videoPoster;
    return '';
  }

  String get qualityLabel => resolveQualityBadgeLabel(
        imageSizes: imageSizes,
        videoInfo: videoInfo,
      );

  String get durationLabel {
    final duration = videoInfo?['duration']?.toString().trim() ?? '';
    return duration;
  }

  String get categoryLabel {
    if (category.trim().isNotEmpty) return category.trim();
    if (categorySlug.trim().isNotEmpty) {
      return categorySlug
          .split('-')
          .map(
            (part) => part.isEmpty
                ? part
                : '${part[0].toUpperCase()}${part.substring(1)}',
          )
          .join(' ');
    }
    return isVideo ? 'Video' : 'Image';
  }

  factory Product.fromJson(Map<String, dynamic> json) {
    final rawSizes = json['imageSizes'];
    final imageSizes = <String, ProductImageSize>{};
    if (rawSizes is Map) {
      for (final entry in rawSizes.entries) {
        if (entry.value is Map) {
          imageSizes[entry.key.toString()] = ProductImageSize.fromJson(
            Map<String, dynamic>.from(entry.value as Map),
          );
        }
      }
    }

    return Product(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      mediaType: json['mediaType']?.toString() ?? 'video',
      category: json['category']?.toString() ?? '',
      categorySlug: json['categorySlug']?.toString() ?? '',
      subCategory: json['subCategory']?.toString() ?? '',
      clipId: json['clipId']?.toString() ?? '',
      brand: json['brand']?.toString() ?? '',
      price: json['price'] is num ? json['price'] as num : 0,
      description: json['description']?.toString() ?? '',
      images: (json['images'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList(),
      demoVideo: json['demoVideo']?.toString() ?? '',
      videoPoster: json['videoPoster']?.toString() ?? '',
      isActive: json['isActive'] != false,
      isPurchasable: json['isPurchasable'] != false,
      imageSizes: imageSizes,
      rating: json['rating'] is num ? json['rating'] as num : null,
      videoInfo: json['videoInfo'] is Map<String, dynamic>
          ? json['videoInfo'] as Map<String, dynamic>
          : null,
      actorId: json['actorId']?.toString(),
      actorName: json['actorName']?.toString() ?? '',
    );
  }
}
