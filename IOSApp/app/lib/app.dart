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
import 'services/apple_iap_service.dart';
import 'services/support_service.dart';

class AkhdMediaApp extends StatefulWidget {
  const AkhdMediaApp({
    super.key,
    required this.catalogProvider,
    required this.authProvider,
    required this.cartProvider,
    required this.orderService,
    required this.supportService,
    required this.appleIapService,
  });

  final CatalogProvider catalogProvider;
  final AuthProvider authProvider;
  final CartProvider cartProvider;
  final OrderService orderService;
  final SupportService supportService;
  final AppleIapService appleIapService;

  @override
  State<AkhdMediaApp> createState() => _AkhdMediaAppState();
}

class _AkhdMediaAppState extends State<AkhdMediaApp> with WidgetsBindingObserver {
  bool _refreshingAuth = false;

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
      _refreshAuthSession();
      _refreshCart();
    }
  }

  Future<void> _refreshAuthSession() async {
    if (_refreshingAuth) return;
    _refreshingAuth = true;
    try {
      await widget.authProvider.bootstrap();
    } finally {
      _refreshingAuth = false;
    }
  }

  Future<void> _refreshCart() async {
    try {
      await widget.cartProvider.loadCart();
    } catch (_) {
      // Ignore transient cart refresh failures.
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
        Provider<AppleIapService>.value(value: widget.appleIapService),
      ],
      child: MaterialApp.router(
        title: Brand.displayName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        routerConfig: appRouter,
        builder: (context, child) {
          return Stack(
            fit: StackFit.expand,
            children: [
              child ?? const SizedBox.shrink(),
              const _SessionRestoreOverlay(),
            ],
          );
        },
      ),
    );
  }
}

class _SessionRestoreOverlay extends StatelessWidget {
  const _SessionRestoreOverlay();

  @override
  Widget build(BuildContext context) {
    return Selector<AuthProvider, bool>(
      selector: (_, auth) => auth.loading,
      builder: (context, loading, _) {
        if (!loading) return const SizedBox.shrink();
        return ColoredBox(
          color: const Color(0xFFF8FAFC),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: const [
                SizedBox(
                  width: 26,
                  height: 26,
                  child: CircularProgressIndicator(strokeWidth: 2.4),
                ),
                SizedBox(height: 12),
                Text(
                  'Restoring session...',
                  style: TextStyle(
                    fontSize: 13,
                    color: Color(0xFF475569),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
