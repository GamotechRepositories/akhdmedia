import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/constants/brand.dart';
import '../../core/theme/app_spacing.dart';
import '../../models/category.dart';
import '../../models/product.dart';
import '../../providers/catalog_provider.dart';
import '../../widgets/cards/tight_product_card.dart';
import '../../widgets/common/error_view.dart';
import '../../widgets/common/loading_view.dart';
import '../../widgets/common/news_ticker.dart';
import '../../widgets/common/section_header.dart';
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

          final latest = catalog.getLatestProducts(limit: 8);

          return RefreshIndicator(
            onRefresh: () => catalog.loadCatalog(force: true),
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _HeroBanner(onBrowse: () => context.go('/videos')),
                const NewsTicker(),
                _CategoryStrip(
                  categories: catalog.categories,
                  onCategoryTap: (slug) => context.go('/videos?category=$slug'),
                ),
                SectionHeader(
                  title: 'Latest Uploads',
                  subtitle: 'Newly graded footage from our contributor network',
                  actionLabel: 'View all',
                  onAction: () => context.go('/videos'),
                ),
                _ProductGrid(
                  products: latest,
                  onProductTap: (id) => context.push('/product/$id'),
                ),
                const SizedBox(height: AppSpacing.section),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _HeroBanner extends StatelessWidget {
  const _HeroBanner({required this.onBrowse});

  final VoidCallback onBrowse;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(AppSpacing.lg),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Text(
              'Stock Library',
              style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          const Text(
            '4K Clips from ₹299',
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            Brand.announcement,
            style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 11),
          ),
          const SizedBox(height: AppSpacing.md),
          FilledButton(
            onPressed: onBrowse,
            style: FilledButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF0F172A),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              minimumSize: Size.zero,
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            child: const Text('Browse videos', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

class _CategoryStrip extends StatelessWidget {
  const _CategoryStrip({
    required this.categories,
    required this.onCategoryTap,
  });

  final List<CatalogCategory> categories;
  final ValueChanged<String> onCategoryTap;

  @override
  Widget build(BuildContext context) {
    if (categories.isEmpty) return const SizedBox.shrink();

    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
        itemBuilder: (context, index) {
          final category = categories[index];
          return ActionChip(
            label: Text(category.navLabel, style: const TextStyle(fontSize: 11)),
            padding: const EdgeInsets.symmetric(horizontal: 4),
            visualDensity: VisualDensity.compact,
            onPressed: () => onCategoryTap(category.slug),
          );
        },
      ),
    );
  }
}

class _ProductGrid extends StatelessWidget {
  const _ProductGrid({
    required this.products,
    required this.onProductTap,
  });

  final List<Product> products;
  final ValueChanged<String> onProductTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: AppSpacing.sm,
          mainAxisSpacing: AppSpacing.sm,
          childAspectRatio: 0.62,
        ),
        itemCount: products.length,
        itemBuilder: (context, index) {
          final product = products[index];
          return TightProductCard(
            product: product,
            onTap: () => onProductTap(product.id),
          );
        },
      ),
    );
  }
}
