import '../../models/category.dart';
import '../../models/product.dart';

const homeCategoryPinLimit = 8;
const minHomeCategoryProducts = 1;

List<Product> getPinnedProductsFromIds(
  List<String> productIds,
  List<Product> products,
) {
  if (productIds.isEmpty) return [];

  final productMap = {for (final product in products) product.id: product};

  return productIds
      .map((id) => productMap[id])
      .whereType<Product>()
      .take(homeCategoryPinLimit)
      .toList();
}

int compareCategorySortOrder(CatalogCategory left, CatalogCategory right) {
  final orderDiff = left.sortOrder - right.sortOrder;
  if (orderDiff != 0) return orderDiff;

  final leftLabel = left.navLabel.isNotEmpty
      ? left.navLabel
      : (left.breadcrumb.isNotEmpty ? left.breadcrumb : left.slug);
  final rightLabel = right.navLabel.isNotEmpty
      ? right.navLabel
      : (right.breadcrumb.isNotEmpty ? right.breadcrumb : right.slug);

  return leftLabel.compareTo(rightLabel);
}

class CategoryBrowsePanel {
  const CategoryBrowsePanel({
    required this.id,
    required this.label,
    required this.desc,
    required this.image,
  });

  final String id;
  final String label;
  final String desc;
  final String image;
}

class DualGridSection {
  const DualGridSection({
    required this.id,
    required this.title,
    required this.categorySlug,
    required this.products,
  });

  final String id;
  final String title;
  final String categorySlug;
  final List<Product> products;
}

List<CategoryBrowsePanel> mapCategoryPanels(List<CatalogCategory> categories) {
  return categories
      .where(
        (category) =>
            category.showInBrowseSection && category.coverImage.isNotEmpty,
      )
      .map(
        (category) => CategoryBrowsePanel(
          id: category.slug,
          label: category.navLabel.isNotEmpty
              ? category.navLabel
              : category.breadcrumb,
          desc: category.label,
          image: category.coverImage,
        ),
      )
      .toList();
}

List<DualGridSection> mapDualGridSections(
  List<CatalogCategory> categories,
  List<Product> products,
) {
  final sorted = [...categories]
    ..sort(compareCategorySortOrder);

  return sorted
      .where((category) => category.isActive)
      .map((category) {
        final pinnedProducts = getPinnedProductsFromIds(
          category.homePinnedProductIds,
          products,
        );

        return DualGridSection(
          id: category.slug,
          title: category.breadcrumb,
          categorySlug: category.slug,
          products: pinnedProducts,
        );
      })
      .where((section) => section.products.length >= minHomeCategoryProducts)
      .toList();
}
