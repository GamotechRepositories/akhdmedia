class ProductImageSize {
  const ProductImageSize({
    required this.resolution,
    required this.size,
    required this.price,
  });

  final String resolution;
  final String size;
  final num price;

  factory ProductImageSize.fromJson(Map<String, dynamic> json) {
    return ProductImageSize(
      resolution: json['resolution']?.toString() ?? '',
      size: json['size']?.toString() ?? '',
      price: json['price'] is num ? json['price'] as num : 0,
    );
  }
}
