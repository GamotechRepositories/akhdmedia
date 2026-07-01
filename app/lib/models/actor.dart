class Actor {
  const Actor({
    required this.id,
    required this.name,
    required this.slug,
    required this.image,
    required this.sortOrder,
    this.searchKeywords = const [],
  });

  final String id;
  final String name;
  final String slug;
  final String image;
  final int sortOrder;
  final List<String> searchKeywords;

  factory Actor.fromJson(Map<String, dynamic> json) {
    return Actor(
      id: json['id']?.toString() ?? json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      image: json['image']?.toString() ?? '',
      sortOrder: json['sortOrder'] is num ? (json['sortOrder'] as num).toInt() : 0,
      searchKeywords: (json['searchKeywords'] as List<dynamic>? ?? [])
          .map((item) => item.toString())
          .toList(),
    );
  }
}

int compareActors(Actor left, Actor right) {
  final orderDiff = left.sortOrder - right.sortOrder;
  if (orderDiff != 0) return orderDiff;
  return left.id.compareTo(right.id);
}
