import '../core/constants/brand.dart';

class HeroSlide {
  const HeroSlide({
    required this.id,
    required this.image,
    this.link = '',
    this.headline = '',
    this.cta = '',
    this.isActive = true,
  });

  final String id;
  final String image;
  final String link;
  final String headline;
  final String cta;
  final bool isActive;

  factory HeroSlide.fromJson(Map<String, dynamic> json, {required int index}) {
    return HeroSlide(
      id: 'hero-settings-$index',
      image: json['image']?.toString().trim() ?? '',
      link: json['link']?.toString() ?? '',
      headline: json['headline']?.toString() ?? '',
      cta: json['cta']?.toString() ?? '',
      isActive: json['isActive'] != false,
    );
  }
}

class HomepageSettings {
  const HomepageSettings({
    required this.tickerItems,
    required this.heroSlides,
    required this.showActorsSection,
    required this.homeLatestProductIds,
  });

  final List<String> tickerItems;
  final List<HeroSlide> heroSlides;
  final bool showActorsSection;
  final List<String> homeLatestProductIds;

  static HomepageSettings get defaults => HomepageSettings(
        tickerItems: Brand.tickerItems,
        heroSlides: const [],
        showActorsSection: true,
        homeLatestProductIds: const [],
      );

  factory HomepageSettings.fromJson(Map<String, dynamic>? json) {
    if (json == null) return HomepageSettings.defaults;

    final rawSlides = json['heroSlides'] as List<dynamic>? ?? [];
    final heroSlides = <HeroSlide>[];
    for (var i = 0; i < rawSlides.length; i++) {
      final slide = HeroSlide.fromJson(
        rawSlides[i] as Map<String, dynamic>,
        index: i,
      );
      if (slide.isActive && slide.image.isNotEmpty) {
        heroSlides.add(slide);
      }
    }

    final tickerItems = (json['tickerItems'] as List<dynamic>? ?? [])
        .map((item) => item.toString().trim())
        .where((item) => item.isNotEmpty)
        .toList();

    final homeLatestProductIds =
        (json['homeLatestProductIds'] as List<dynamic>? ?? [])
            .map((id) => id.toString())
            .toList();

    return HomepageSettings(
      tickerItems: tickerItems.isNotEmpty ? tickerItems : Brand.tickerItems,
      heroSlides: heroSlides,
      showActorsSection: json['showActorsSection'] != false,
      homeLatestProductIds: homeLatestProductIds,
    );
  }
}
