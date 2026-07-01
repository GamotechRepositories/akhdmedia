import 'product.dart';

class CartItem {
  const CartItem({
    required this.id,
    required this.product,
    required this.productId,
    required this.quantity,
    required this.imageSize,
    required this.price,
    this.basePrice = 0,
    this.gstAmount = 0,
  });

  final String id;
  final Product? product;
  final String productId;
  final int quantity;
  final String imageSize;
  final num price;
  final num basePrice;
  final num gstAmount;

  num get lineTotal => price * quantity;
  num get lineSubtotal => (basePrice > 0 ? basePrice : price) * quantity;
  num get lineGst => gstAmount * quantity;

  factory CartItem.fromJson(Map<String, dynamic> json) {
    final productJson = json['product'];
    final price = json['price'] is num ? json['price'] as num : 0;
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
      price: price,
      basePrice: json['basePrice'] is num ? json['basePrice'] as num : price,
      gstAmount: json['gstAmount'] is num ? json['gstAmount'] as num : 0,
    );
  }
}

class CartState {
  const CartState({
    this.id = '',
    this.items = const [],
    this.subtotal = 0,
    this.gstTotal = 0,
    this.discountAmount = 0,
    this.total = 0,
    this.itemCount = 0,
  });

  final String id;
  final List<CartItem> items;
  final num subtotal;
  final num gstTotal;
  final num discountAmount;
  final num total;
  final int itemCount;

  bool get isEmpty => items.isEmpty;

  num get displaySubtotal {
    if (subtotal > 0) return subtotal;
    return items.fold<num>(0, (sum, item) => sum + item.lineSubtotal);
  }

  num get displayGstTotal {
    if (gstTotal > 0) return gstTotal;
    return items.fold<num>(0, (sum, item) => sum + item.lineGst);
  }

  num get displayTotal {
    if (total > 0) return total;
    return displaySubtotal + displayGstTotal - discountAmount;
  }

  factory CartState.fromJson(Map<String, dynamic> json) {
    final itemsJson = json['items'] as List<dynamic>? ?? [];
    final items = itemsJson
        .whereType<Map<String, dynamic>>()
        .map(CartItem.fromJson)
        .toList();
    return CartState(
      id: json['id']?.toString() ?? '',
      items: items,
      subtotal: json['subtotal'] is num ? json['subtotal'] as num : 0,
      gstTotal: json['gstTotal'] is num ? json['gstTotal'] as num : 0,
      discountAmount:
          json['discountAmount'] is num ? json['discountAmount'] as num : 0,
      total: json['total'] is num ? json['total'] as num : 0,
      itemCount: json['itemCount'] is int
          ? json['itemCount'] as int
          : int.tryParse(json['itemCount']?.toString() ?? '') ?? 0,
    );
  }
}
