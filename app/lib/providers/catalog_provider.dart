import 'package:flutter/foundation.dart';

import '../core/utils/category_content.dart';
import '../models/actor.dart';
import '../models/category.dart';
import '../models/homepage_settings.dart';
import '../models/product.dart';
import '../services/catalog_service.dart';

class CatalogProvider extends ChangeNotifier {
  CatalogProvider(this._catalogService);

  final CatalogService _catalogService;

  List<CatalogCategory> categories = [];
  List<Product> products = [];
  List<Actor> actors = [];
  HomepageSettings homepageSettings = HomepageSettings.defaults;
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
      actors = data.actors;
      homepageSettings = data.homepageSettings;
    } catch (e) {
      error = e.toString();
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<Product?> fetchProductById(String id) async {
    try {
      return await _catalogService.fetchProductById(id);
    } catch (_) {
      return null;
    }
  }

  Future<void> upsertProduct(Product product) async {
    final index = products.indexWhere((p) => p.id == product.id);
    if (index >= 0) {
      products = [...products]..[index] = product;
    } else {
      products = [...products, product];
    }
    notifyListeners();
  }

  Product? getProductById(String id) {
    try {
      return products.firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
  }

  Actor? getActorById(String id) {
    try {
      return actors.firstWhere((actor) => actor.id == id);
    } catch (_) {
      return null;
    }
  }

  List<Product> getLatestUploads() {
    return getPinnedProductsFromIds(
      homepageSettings.homeLatestProductIds,
      products,
    );
  }

  List<CategoryBrowsePanel> getBrowsePanels() {
    return mapCategoryPanels(categories);
  }

  List<DualGridSection> getDualGridSections() {
    return mapDualGridSections(categories, products);
  }

  List<Product> getRelatedProducts(String productId, {int limit = 32}) {
    final current = getProductById(productId);
    if (current == null) return [];

    if (current.resolvedActorIds.isNotEmpty) {
      final sameActor = products
          .where(
            (p) => p.id != productId && current.sharesActorWith(p),
          )
          .toList();
      final others = products
          .where(
            (p) => p.id != productId && !current.sharesActorWith(p),
          )
          .toList();
      return [...sameActor, ...others].take(limit).toList();
    }

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
    String? actorId,
  }) {
    final query = searchQuery?.trim().toLowerCase() ?? '';

    return products.where((product) {
      if (actorId != null && actorId.isNotEmpty) {
        return product.hasActor(actorId);
      }
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
