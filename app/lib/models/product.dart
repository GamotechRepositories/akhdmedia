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
    this.rating,
    this.videoInfo,
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
  final num? rating;
  final Map<String, dynamic>? videoInfo;

  bool get isVideo => mediaType == 'video';

  String get thumbnailUrl {
    for (final image in images) {
      if (image.trim().isNotEmpty) return image;
    }
    if (videoPoster.trim().isNotEmpty) return videoPoster;
    return '';
  }

  String get qualityLabel {
    final info = videoInfo;
    if (info != null) {
      final quality = info['quality']?.toString();
      if (quality != null && quality.isNotEmpty) {
        return quality.split(' ').first.toUpperCase();
      }
    }
    return 'HD';
  }

  factory Product.fromJson(Map<String, dynamic> json) {
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
      rating: json['rating'] is num ? json['rating'] as num : null,
      videoInfo: json['videoInfo'] is Map<String, dynamic>
          ? json['videoInfo'] as Map<String, dynamic>
          : null,
    );
  }
}
