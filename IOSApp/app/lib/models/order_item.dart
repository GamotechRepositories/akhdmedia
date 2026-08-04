class OrderItem {
  const OrderItem({
    required this.productId,
    required this.name,
    required this.image,
    required this.imageSize,
    required this.quantity,
    required this.price,
    required this.lineTotal,
    required this.clipId,
    required this.licenseNumber,
    this.brand = '',
  });

  final String productId;
  final String name;
  final String image;
  final String imageSize;
  final int quantity;
  final num price;
  final num lineTotal;
  final String clipId;
  final String licenseNumber;
  final String brand;

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      productId: json['productId']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      image: json['image']?.toString() ?? '',
      imageSize: json['imageSize']?.toString() ?? '',
      quantity: json['quantity'] is int
          ? json['quantity'] as int
          : int.tryParse(json['quantity']?.toString() ?? '') ?? 1,
      price: json['price'] is num ? json['price'] as num : 0,
      lineTotal: json['lineTotal'] is num ? json['lineTotal'] as num : 0,
      clipId: json['clipId']?.toString() ?? '',
      licenseNumber: json['licenseNumber']?.toString() ?? '',
      brand: json['brand']?.toString() ?? '',
    );
  }
}
