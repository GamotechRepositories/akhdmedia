import '../models/cart_models.dart';
import 'api_client.dart';

class CartService {
  CartService(this._api);

  final ApiClient _api;

  Future<CartState> getCart() async {
    final response = await _api.getJson('/cart');
    return _parseCart(response);
  }

  Future<CartState> addItem({
    required String productId,
    int quantity = 1,
    String imageSize = '',
  }) async {
    final response = await _api.postJson('/cart/items', data: {
      'productId': productId,
      'quantity': quantity,
      'imageSize': imageSize,
    });
    return _parseCart(response);
  }

  Future<CartState> buyNow({
    required String productId,
    int quantity = 1,
    String imageSize = '',
  }) async {
    final response = await _api.postJson('/cart/buy-now', data: {
      'productId': productId,
      'quantity': quantity,
      'imageSize': imageSize,
    });
    return _parseCart(response);
  }

  Future<CartState> updateItem(String itemId, int quantity) async {
    final response = await _api.patchJson('/cart/items/$itemId', data: {
      'quantity': quantity,
    });
    return _parseCart(response);
  }

  Future<CartState> removeItem(String itemId) async {
    final response = await _api.deleteJson('/cart/items/$itemId');
    return _parseCart(response);
  }

  Future<CartState> clearCart() async {
    final response = await _api.deleteJson('/cart');
    return _parseCart(response);
  }

  CartState _parseCart(Map<String, dynamic> response) {
    final cartJson = response['data']?['cart'];
    if (cartJson is! Map<String, dynamic>) {
      return const CartState();
    }
    return CartState.fromJson(cartJson);
  }
}
