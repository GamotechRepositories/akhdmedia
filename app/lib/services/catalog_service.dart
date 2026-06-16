import '../models/category.dart';
import '../models/product.dart';
import 'api_client.dart';

class CatalogService {
  CatalogService(this._api);

  final ApiClient _api;

  Future<({List<CatalogCategory> categories, List<Product> products})>
      fetchCatalog() async {
    final results = await Future.wait([
      _api.get<List<dynamic>>('/categories'),
      _api.get<List<dynamic>>('/products'),
    ]);

    final categories = (results[0].data ?? [])
        .map((e) => CatalogCategory.fromJson(e as Map<String, dynamic>))
        .where((c) => c.isActive)
        .toList();

    final products = (results[1].data ?? [])
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .where((p) => p.isActive)
        .toList();

    return (categories: categories, products: products);
  }

  Future<Product?> fetchProductById(String id) async {
    final response = await _api.get<Map<String, dynamic>>('/products/$id');
    final data = response.data;
    if (data == null) return null;
    return Product.fromJson(data);
  }
}
