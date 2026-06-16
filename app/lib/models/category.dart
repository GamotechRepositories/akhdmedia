class CatalogCategory {
  const CatalogCategory({
    required this.id,
    required this.slug,
    required this.label,
    required this.navLabel,
    required this.breadcrumb,
    required this.isActive,
    required this.subCategories,
  });

  final String id;
  final String slug;
  final String label;
  final String navLabel;
  final String breadcrumb;
  final bool isActive;
  final List<SubCategory> subCategories;

  factory CatalogCategory.fromJson(Map<String, dynamic> json) {
    final subs = (json['subCategories'] as List<dynamic>? ?? [])
        .map((e) => SubCategory.fromJson(e as Map<String, dynamic>))
        .toList();

    return CatalogCategory(
      id: json['_id']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      label: json['label']?.toString() ?? '',
      navLabel: json['navLabel']?.toString() ?? '',
      breadcrumb: json['breadcrumb']?.toString() ?? '',
      isActive: json['isActive'] != false,
      subCategories: subs,
    );
  }
}

class SubCategory {
  const SubCategory({required this.slug, required this.name});

  final String slug;
  final String name;

  factory SubCategory.fromJson(Map<String, dynamic> json) {
    return SubCategory(
      slug: json['slug']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
    );
  }
}
