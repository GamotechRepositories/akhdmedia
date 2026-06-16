import 'package:flutter/foundation.dart';

import '../models/cart_models.dart';
import '../services/api_client.dart';
import '../services/cart_service.dart';

class CartProvider extends ChangeNotifier {
  CartProvider(this._cartService);

  final CartService _cartService;

  CartState cart = const CartState();
  bool loading = true;
  String? error;

  Future<void> loadCart() async {
    loading = true;
    notifyListeners();

    try {
      cart = await _cartService.getCart();
      error = null;
    } catch (e) {
      cart = const CartState();
      error = ApiClient.unwrapError(e).toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> addToCart(String productId, {int quantity = 1}) async {
    cart = await _cartService.addItem(productId: productId, quantity: quantity);
    notifyListeners();
  }

  Future<void> buyNow(String productId, {int quantity = 1}) async {
    cart = await _cartService.buyNow(productId: productId, quantity: quantity);
    notifyListeners();
  }

  Future<void> updateQuantity(String itemId, int quantity) async {
    if (quantity < 1) return;
    cart = await _cartService.updateItem(itemId, quantity);
    notifyListeners();
  }

  Future<void> removeItem(String itemId) async {
    cart = await _cartService.removeItem(itemId);
    notifyListeners();
  }

  Future<void> clearCart() async {
    cart = await _cartService.clearCart();
    notifyListeners();
  }
}
