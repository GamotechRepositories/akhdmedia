import 'package:flutter_test/flutter_test.dart';
import 'package:akhdmedia_app/models/cart_models.dart';

void main() {
  group('CartState Promo Code Tests', () {
    test('CartState defaults to empty applied promo code and hasPromo false', () {
      const cart = CartState();
      expect(cart.appliedPromoCode, '');
      expect(cart.hasPromo, isFalse);
      expect(cart.discountAmount, 0);
    });

    test('CartState.fromJson parses appliedPromo code and discountAmount correctly', () {
      final json = {
        'id': 'cart_123',
        'items': [],
        'subtotal': 1000,
        'gstTotal': 180,
        'discountAmount': 100,
        'total': 1080,
        'itemCount': 1,
        'appliedPromo': {
          'code': 'SAVE10',
          'discountAmount': 100,
        },
      };

      final cart = CartState.fromJson(json);

      expect(cart.id, 'cart_123');
      expect(cart.appliedPromoCode, 'SAVE10');
      expect(cart.hasPromo, isTrue);
      expect(cart.discountAmount, 100);
      expect(cart.total, 1080);
      expect(cart.subtotal, 1000);
      expect(cart.gstTotal, 180);
    });

    test('CartState.fromJson handles null or missing appliedPromo gracefully', () {
      final json = {
        'id': 'cart_456',
        'items': [],
        'subtotal': 500,
        'gstTotal': 90,
        'discountAmount': 0,
        'total': 590,
        'itemCount': 1,
        'appliedPromo': null,
      };

      final cart = CartState.fromJson(json);

      expect(cart.id, 'cart_456');
      expect(cart.appliedPromoCode, '');
      expect(cart.hasPromo, isFalse);
      expect(cart.discountAmount, 0);
    });
  });
}
