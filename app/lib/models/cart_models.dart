import 'product.dart';

class CartItem {
  const CartItem({
    required this.id,
    required this.product,
    required this.productId,
    required this.quantity,
    required this.imageSize,
    required this.price,
  });

  final String id;
  final Product? product;
  final String productId;
  final int quantity;
  final String imageSize;
  final num price;

  num get lineTotal => price * quantity;

  factory CartItem.fromJson(Map<String, dynamic> json) {
    final productJson = json['product'];
  return CartItem(
      id: json['id']?.toString() ?? '',
      product: productJson is Map<String, dynamic>
          ? Product.fromJson(productJson)
          : null,
      productId: json['productId']?.toString() ?? '',
      quantity: json['quantity'] is int
          ? json['quantity'] as int
          : int.tryParse(json['quantity']?.toString() ?? '') ?? 1,
      imageSize: json['imageSize']?.toString() ?? '',
      price: json['price'] is num ? json['price'] as num : 0,
    );
  }
}

class CartState {
  const CartState({
    this.id = '',
    this.items = const [],
    this.total = 0,
    this.itemCount = 0,
  });

  final String id;
  final List<CartItem> items;
  final num total;
  final int itemCount;

  bool get isEmpty => items.isEmpty;

  factory CartState.fromJson(Map<String, dynamic> json) {
    final itemsJson = json['items'] as List<dynamic>? ?? [];
    return CartState(
      id: json['id']?.toString() ?? '',
      items: itemsJson
          .whereType<Map<String, dynamic>>()
          .map(CartItem.fromJson)
          .toList(),
      total: json['total'] is num ? json['total'] as num : 0,
      itemCount: json['itemCount'] is int
          ? json['itemCount'] as int
          : int.tryParse(json['itemCount']?.toString() ?? '') ?? 0,
    );
  }
}
