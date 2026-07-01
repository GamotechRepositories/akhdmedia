import '../models/actor.dart';
import '../models/category.dart';
import '../models/homepage_settings.dart';
import '../models/product.dart';
import 'api_client.dart';

class CatalogData {
  const CatalogData({
    required this.categories,
    required this.products,
    required this.homepageSettings,
    required this.actors,
  });

  final List<CatalogCategory> categories;
  final List<Product> products;
  final HomepageSettings homepageSettings;
  final List<Actor> actors;
}

class CatalogService {
  CatalogService(this._api);

  final ApiClient _api;

  Future<CatalogData> fetchCatalog() async {
    final dio = _api.dio;

    final categoriesResponse = await dio.get<List<dynamic>>('/categories');
    final productsResponse = await dio.get<List<dynamic>>('/products');

    Map<String, dynamic>? siteContentJson;
    List<dynamic>? actorsJson;
    try {
      final siteContentResponse =
          await dio.get<Map<String, dynamic>>('/site-content');
      siteContentJson = siteContentResponse.data;
    } catch (_) {}
    try {
      final actorsResponse = await dio.get<List<dynamic>>('/actors');
      actorsJson = actorsResponse.data;
    } catch (_) {}

    final categories = (categoriesResponse.data ?? [])
        .map((e) => CatalogCategory.fromJson(e as Map<String, dynamic>))
        .where((c) => c.isActive)
        .toList();

    final products = (productsResponse.data ?? [])
        .map((e) => Product.fromJson(e as Map<String, dynamic>))
        .where((p) => p.isActive)
        .toList();

    final homepageSettings = HomepageSettings.fromJson(siteContentJson);

    final actors = (actorsJson ?? [])
        .map((e) => Actor.fromJson(e as Map<String, dynamic>))
        .toList()
      ..sort(compareActors);

    return CatalogData(
      categories: categories,
      products: products,
      homepageSettings: homepageSettings,
      actors: actors,
    );
  }

  Future<Product?> fetchProductById(String id) async {
    final response = await _api.dio.get<Map<String, dynamic>>('/products/$id');
    final data = response.data;
    if (data == null) return null;
    return Product.fromJson(data);
  }
}
