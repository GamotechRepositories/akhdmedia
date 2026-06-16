import 'package:flutter/material.dart';

import 'app.dart';
import 'providers/catalog_provider.dart';
import 'services/api_client.dart';
import 'services/catalog_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  final catalogProvider = CatalogProvider(CatalogService(ApiClient()));

  runApp(AkhdMediaApp(catalogProvider: catalogProvider));
}
