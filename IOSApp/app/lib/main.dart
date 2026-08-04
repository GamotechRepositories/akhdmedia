import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'app.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/catalog_provider.dart';
import 'services/api_client.dart';
import 'services/auth_service.dart';
import 'services/cart_service.dart';
import 'services/catalog_service.dart';
import 'services/order_service.dart';
import 'services/support_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('en_IN');

  final apiClient = await ApiClient.create();
  final authService = AuthService(apiClient);
  final cartService = CartService(apiClient);
  final orderService = OrderService(apiClient);
  final supportService = SupportService(apiClient);
  final catalogService = CatalogService(apiClient);

  final authProvider = AuthProvider(authService);
  final cartProvider = CartProvider(cartService);
  final catalogProvider = CatalogProvider(catalogService);

  await authProvider.bootstrap();
  await cartProvider.loadCart();

  runApp(
    AkhdMediaApp(
      catalogProvider: catalogProvider,
      authProvider: authProvider,
      cartProvider: cartProvider,
      orderService: orderService,
      supportService: supportService,
    ),
  );
}
