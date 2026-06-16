import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/routing/app_router.dart';
import 'core/theme/app_theme.dart';
import 'providers/catalog_provider.dart';

class AkhdMediaApp extends StatelessWidget {
  const AkhdMediaApp({super.key, required this.catalogProvider});

  final CatalogProvider catalogProvider;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<CatalogProvider>.value(value: catalogProvider),
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
