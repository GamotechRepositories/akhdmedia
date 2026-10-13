import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:akhdmedia_app/models/cart_models.dart';
import 'package:akhdmedia_app/providers/cart_provider.dart';
import 'package:akhdmedia_app/services/api_client.dart';
import 'package:akhdmedia_app/services/cart_service.dart';
import 'package:akhdmedia_app/screens/commerce/cart_screen.dart';

class _FakeCartService extends Fake implements CartService {
  @override
  Future<CartState> getCart() async {
    return const CartState();
  }
}

void main() {
  testWidgets('CartScreen shows empty cart view when cart is empty', (tester) async {
    final fakeService = _FakeCartService();
    final provider = CartProvider(fakeService);

    await tester.pumpWidget(
      ChangeNotifierProvider<CartProvider>.value(
        value: provider,
        child: const MaterialApp(
          home: CartScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('Your bag is empty'), findsOneWidget);
  });
}
