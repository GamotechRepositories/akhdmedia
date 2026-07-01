import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/constants/brand.dart';
import 'core/routing/app_router.dart';
import 'core/theme/app_theme.dart';
import 'core/utils/screen_protection.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/catalog_provider.dart';
import 'services/order_service.dart';
import 'services/support_service.dart';

class AkhdMediaApp extends StatefulWidget {
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
  State<AkhdMediaApp> createState() => _AkhdMediaAppState();
}

class _AkhdMediaAppState extends State<AkhdMediaApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    scheduleAppScreenProtection();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      enableAppScreenProtection();
    }
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<CatalogProvider>.value(value: widget.catalogProvider),
        ChangeNotifierProvider<AuthProvider>.value(value: widget.authProvider),
        ChangeNotifierProvider<CartProvider>.value(value: widget.cartProvider),
        Provider<OrderService>.value(value: widget.orderService),
        Provider<SupportService>.value(value: widget.supportService),
      ],
      child: MaterialApp.router(
        title: Brand.displayName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        routerConfig: appRouter,
      ),
    );
  }
}
