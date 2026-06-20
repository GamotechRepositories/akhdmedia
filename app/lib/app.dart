import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/routing/app_router.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/catalog_provider.dart';
import 'services/order_service.dart';
import 'services/support_service.dart';

class AkhdMediaApp extends StatelessWidget {
  const AkhdMediaApp({
    super.key,
    required this.catalogProvider,
    required this.authProvider,
    required this.cartProvider,
    required this.orderService,
    required this.supportService,
  });

  final CatalogProvider catalogProvider;
  final AuthProvider authProvider;
  final CartProvider cartProvider;
  final OrderService orderService;
  final SupportService supportService;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<CatalogProvider>.value(value: catalogProvider),
        ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
        ChangeNotifierProvider<CartProvider>.value(value: cartProvider),
        Provider<OrderService>.value(value: orderService),
        Provider<SupportService>.value(value: supportService),
      ],
      child: MaterialApp.router(
        title: 'AKHD Media',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        routerConfig: appRouter,
      ),
    );
  }
}
