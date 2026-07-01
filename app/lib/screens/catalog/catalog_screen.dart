import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_spacing.dart';
import '../../providers/catalog_provider.dart';
import '../../widgets/cards/tight_product_card.dart';
import '../../widgets/common/error_view.dart';
import '../../widgets/common/loading_view.dart';
import '../shell/main_shell.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({
    super.key,
    this.initialCategory,
    this.initialSubCategory,
    this.initialSearch,
    this.initialActor,
  });

  final String? initialCategory;
  final String? initialSubCategory;
  final String? initialSearch;
  final String? initialActor;

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  late String? _category = widget.initialCategory;
  late String? _subCategory = widget.initialSubCategory;
  late String? _actor = widget.initialActor;
  late final TextEditingController _searchController =
      TextEditingController(text: widget.initialSearch ?? '');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().loadCatalog();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const StoreAppBar(title: 'Videos'),
      body: Consumer<CatalogProvider>(
        builder: (context, catalog, _) {
          if (catalog.loading && catalog.products.isEmpty) {
            return const LoadingView(message: 'Loading videos...');
          }
          if (catalog.error != null && catalog.products.isEmpty) {
            return ErrorView(
              message: catalog.error!,
              onRetry: () => catalog.loadCatalog(force: true),
            );
          }

          final selectedActor =
              _actor != null ? catalog.getActorById(_actor!) : null;
          final pageTitle = selectedActor != null
              ? '${selectedActor.name} Footage'
              : 'Videos';

          final filtered = catalog.filterProducts(
            categorySlug: _actor != null ? null : _category,
            subCategorySlug: _actor != null ? null : _subCategory,
            searchQuery: _searchController.text,
            actorId: _actor,
          );

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (selectedActor != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    AppSpacing.sm,
                    AppSpacing.lg,
                    0,
                  ),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back, size: 20),
                        onPressed: () => context.go('/actors'),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          pageTitle,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  AppSpacing.sm,
                  AppSpacing.lg,
                  AppSpacing.sm,
                ),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search name, clip ID, category...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {});
                            },
                          )
                        : null,
                  ),
                  onChanged: (_) => setState(() {}),
                ),
              ),
              if (_actor == null)
                SizedBox(
                  height: 34,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding:
                        const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
                    children: [
                      _FilterChip(
                        label: 'All',
                        selected: _category == null,
                        onTap: () => setState(() {
                          _category = null;
                          _subCategory = null;
                        }),
                      ),
                      ...catalog.categories.map((category) {
                        return _FilterChip(
                          label: category.navLabel,
                          selected: _category == category.slug,
                          onTap: () => setState(() {
                            _category = category.slug;
                            _subCategory = null;
                          }),
                        );
                      }),
                    ],
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  AppSpacing.sm,
                  AppSpacing.lg,
                  AppSpacing.sm,
                ),
                child: Text(
                  'Showing ${filtered.length} clips',
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                ),
              ),
              Expanded(
                child: filtered.isEmpty
                    ? const Center(child: Text('No clips match your filters.'))
                    : GridView.builder(
                        padding: const EdgeInsets.fromLTRB(
                          AppSpacing.lg,
                          0,
                          AppSpacing.lg,
                          AppSpacing.lg,
                        ),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: AppSpacing.sm,
                          mainAxisSpacing: AppSpacing.sm,
                          childAspectRatio: 0.56,
                        ),
                        itemCount: filtered.length,
                        itemBuilder: (context, index) {
                          final product = filtered[index];
                          return TightProductCard(
                            product: product,
                            onTap: () => context.push('/product/${product.id}'),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: AppSpacing.sm),
      child: FilterChip(
        label: Text(label, style: const TextStyle(fontSize: 11)),
        selected: selected,
        visualDensity: VisualDensity.compact,
        onSelected: (_) => onTap(),
      ),
    );
  }
}
