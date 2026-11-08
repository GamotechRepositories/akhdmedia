import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/constants/home_sections.dart';
import '../../models/homepage_settings.dart';
import '../../providers/catalog_provider.dart';
import '../../widgets/common/error_view.dart';
import '../../widgets/common/loading_view.dart';
import '../../widgets/common/news_ticker.dart';
import '../../widgets/home/actor_rail.dart';
import '../../widgets/home/category_browse_section.dart';
import '../../widgets/home/dual_category_sections.dart';
import '../../widgets/home/hero_carousel.dart';
import '../../widgets/home/home_product_section.dart';
import '../shell/main_shell.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().loadCatalog();
    });
  }

  void _openHeroSlide(HeroSlide slide) {
    final link = slide.link.trim();
    if (link.isEmpty) {
      context.go(HomeSections.latestUploadsViewAllPath);
      return;
    }

    if (link.startsWith('http://') || link.startsWith('https://')) {
      return;
    }

    final path = link.startsWith('/') ? link : '/$link';
    context.go(path);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const StoreAppBar(showSearch: true),
      body: Consumer<CatalogProvider>(
        builder: (context, catalog, _) {
          if (catalog.loading && catalog.products.isEmpty) {
            return const LoadingView(message: 'Loading catalog...');
          }
          if (catalog.error != null && catalog.products.isEmpty) {
            return ErrorView(
              message: catalog.error!,
              onRetry: () => catalog.loadCatalog(force: true),
            );
          }

          final latestProducts = catalog.getLatestUploads();
          final showLatestSection = catalog.loading || latestProducts.isNotEmpty;
          final showActorsSection = catalog.homepageSettings.showActorsSection;

          return RefreshIndicator(
            onRefresh: () => catalog.loadCatalog(force: true),
            child: ListView(
              padding: EdgeInsets.only(
                bottom: MediaQuery.paddingOf(context).bottom,
              ),
              children: [
                HeroCarousel(
                  slides: catalog.homepageSettings.heroSlides,
                  isLoading: catalog.loading,
                  onSlideTap: _openHeroSlide,
                  onFallbackBrowse: () =>
                      context.go(HomeSections.latestUploadsViewAllPath),
                ),
                NewsTicker(items: catalog.homepageSettings.tickerItems),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(22),
                      color: const Color(0xFF111827),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF111827).withValues(alpha: 0.15),
                          blurRadius: 24,
                          offset: const Offset(0, 12),
                        ),
                      ],
                    ),
                    child: Material(
                      color: Colors.transparent,
                      borderRadius: BorderRadius.circular(22),
                      clipBehavior: Clip.antiAlias,
                      child: ListTile(
                        leading: const Icon(Icons.subscriptions_outlined, color: Colors.white),
                        title: const Text('Editorial video subscriptions', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        subtitle: const Text('Daily WhatsApp delivery & website downloads', style: TextStyle(color: Color(0xFFDBEAFE))),
                        trailing: const Icon(Icons.chevron_right, color: Colors.white),
                        onTap: () => context.push('/subscriptions'),
                      ),
                    ),
                  ),
                ),
                if (showActorsSection)
                  ActorRail(
                    actors: catalog.actors,
                    isLoading: catalog.loading,
                    onActorTap: (actor) =>
                        context.go('/videos?actor=${Uri.encodeComponent(actor.id)}'),
                    onViewAll: () => context.go(HomeSections.actorsViewAllPath),
                  ),
                CategoryBrowseSection(
                  panels: catalog.getBrowsePanels(),
                  isLoading: catalog.loading,
                  onPanelTap: (slug) =>
                      context.go('/videos?category=${Uri.encodeComponent(slug)}'),
                ),
                if (showLatestSection)
                  HomeProductSection(
                    title: HomeSections.latestUploadsTitle,
                    products: latestProducts,
                    isLoading: catalog.loading,
                    tightTop: true,
                    onProductTap: (id) => context.push('/product/$id'),
                    onViewAll: () =>
                        context.go(HomeSections.latestUploadsViewAllPath),
                  ),
                DualCategorySections(
                  sections: catalog.getDualGridSections(),
                  isLoading: catalog.loading,
                  onProductTap: (id) => context.push('/product/$id'),
                  onViewAll: (slug) =>
                      context.go('/videos?category=${Uri.encodeComponent(slug)}'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
