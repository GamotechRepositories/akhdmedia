import 'package:flutter/foundation.dart';

import '../models/category.dart';
import '../models/product.dart';
import '../services/catalog_service.dart';

class CatalogProvider extends ChangeNotifier {
  CatalogProvider(this._catalogService);

  final CatalogService _catalogService;

  List<CatalogCategory> categories = [];
  List<Product> products = [];
  bool loading = false;
  String? error;

  Future<void> loadCatalog({bool force = false}) async {
    if (loading) return;
    if (!force && products.isNotEmpty) return;

    loading = true;
    error = null;
    notifyListeners();

    try {
      final data = await _catalogService.fetchCatalog();
      categories = data.categories;
      products = data.products;
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Product? getProductById(String id) {
    try {
      return products.firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
  }

  List<Product> getLatestProducts({int limit = 8}) {
    return products.take(limit).toList();
  }

  List<Product> getRelatedProducts(String productId, {int limit = 32}) {
    final current = getProductById(productId);
    if (current == null) return [];

    return products
        .where(
          (p) =>
              p.id != productId &&
              (p.categorySlug == current.categorySlug ||
                  p.subCategory == current.subCategory),
        )
        .take(limit)
        .toList();
  }

  List<Product> filterProducts({
    String? categorySlug,
    String? subCategorySlug,
    String? searchQuery,
  }) {
    final query = searchQuery?.trim().toLowerCase() ?? '';

    return products.where((product) {
      if (categorySlug != null &&
          categorySlug.isNotEmpty &&
          product.categorySlug != categorySlug) {
        return false;
      }
      if (subCategorySlug != null &&
          subCategorySlug.isNotEmpty &&
          product.subCategory != subCategorySlug) {
        return false;
      }
      if (query.isEmpty) return true;

      final haystack = [
        product.name,
        product.clipId,
        product.category,
        product.brand,
        product.description,
        product.categorySlug,
        product.subCategory,
      ].join(' ').toLowerCase();

      return haystack.contains(query);
    }).toList();
  }
}
