import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_spacing.dart';
import '../../providers/catalog_provider.dart';
import '../../widgets/cards/tight_product_card.dart';
import '../../widgets/common/error_view.dart';
import '../../widgets/common/loading_view.dart';

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
  final FocusNode _searchFocus = FocusNode();
  final ScrollController _scrollController = ScrollController();
  late bool _searchOpen = (widget.initialSearch ?? '').trim().isNotEmpty;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CatalogProvider>().loadCatalog();
      _scrollToTop();
    });
  }

  @override
  void didUpdateWidget(covariant CatalogScreen oldWidget) {
    super.didUpdateWidget(oldWidget);

    final nextSearch = widget.initialSearch ?? '';
    if (oldWidget.initialSearch != widget.initialSearch &&
        _searchController.text != nextSearch) {
      _searchController.text = nextSearch;
      if (nextSearch.trim().isNotEmpty) {
        _searchOpen = true;
      }
    }

    if (oldWidget.initialCategory != widget.initialCategory ||
        oldWidget.initialSubCategory != widget.initialSubCategory ||
        oldWidget.initialActor != widget.initialActor) {
      setState(() {
        _category = widget.initialCategory;
        _subCategory = widget.initialSubCategory;
        _actor = widget.initialActor;
      });
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToTop());
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  void _scrollToTop() {
    if (!_scrollController.hasClients) return;
    _scrollController.animateTo(
      0,
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOut,
    );
  }

  void _toggleSearch() {
    setState(() {
      if (_searchOpen) {
        _searchController.clear();
        _searchOpen = false;
        _searchFocus.unfocus();
      } else {
        _searchOpen = true;
      }
    });
    if (_searchOpen) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _searchFocus.requestFocus();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Videos'),
        actions: [
          IconButton(
            icon: Icon(
              _searchOpen ? Icons.close_rounded : Icons.search_rounded,
              size: 22,
            ),
            tooltip: _searchOpen ? 'Close search' : 'Search',
            onPressed: _toggleSearch,
          ),
          IconButton(
            icon: const Icon(Icons.support_agent_outlined, size: 22),
            onPressed: () => context.push('/support'),
          ),
        ],
      ),
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
              if (_searchOpen)
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    AppSpacing.sm,
                    AppSpacing.lg,
                    AppSpacing.sm,
                  ),
                  child: SizedBox(
                    height: 42,
                    child: TextField(
                      controller: _searchController,
                      focusNode: _searchFocus,
                      decoration: InputDecoration(
                        hintText: 'Search name, clip ID, category...',
                        hintStyle: TextStyle(
                          fontSize: 13,
                          color: Colors.grey.shade500,
                        ),
                        filled: true,
                        fillColor: Colors.white,
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        prefixIcon: Icon(
                          Icons.search_rounded,
                          size: 18,
                          color: Colors.grey.shade600,
                        ),
                        prefixIconConstraints: const BoxConstraints(
                          minHeight: 36,
                          minWidth: 36,
                        ),
                        suffixIcon: _searchController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.close_rounded, size: 16),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {});
                                },
                              )
                            : null,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide(color: Colors.grey.shade200),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(
                            color: Color(0xFF111827),
                            width: 1.2,
                          ),
                        ),
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                  ),
                ),
              if (_actor == null)
                Padding(
                  padding: EdgeInsets.only(
                    top: _searchOpen ? 0 : AppSpacing.sm,
                    bottom: AppSpacing.sm,
                  ),
                  child: SizedBox(
                    height: 30,
                    child: ListView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.lg,
                      ),
                      children: [
                        _FilterChip(
                          label: 'All',
                          selected: _category == null,
                          onTap: () {
                            setState(() {
                              _category = null;
                              _subCategory = null;
                            });
                            _scrollToTop();
                          },
                        ),
                        ...catalog.categories.map((category) {
                          return _FilterChip(
                            label: category.navLabel,
                            selected: _category == category.slug,
                            onTap: () {
                              setState(() {
                                _category = category.slug;
                                _subCategory = null;
                              });
                              _scrollToTop();
                            },
                          );
                        }),
                      ],
                    ),
                  ),
                ),
              Expanded(
                child: filtered.isEmpty
                    ? const Center(child: Text('No clips match your filters.'))
                    : GridView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.fromLTRB(
                          AppSpacing.lg,
                          0,
                          AppSpacing.lg,
                          AppSpacing.lg,
                        ),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: AppSpacing.sm,
                          mainAxisSpacing: AppSpacing.xs,
                          childAspectRatio: 0.54,
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
        label: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : const Color(0xFF374151),
          ),
        ),
        selected: selected,
        showCheckmark: false,
        selectedColor: const Color(0xFF111827),
        backgroundColor: Colors.white,
        side: BorderSide(
          color: selected ? const Color(0xFF111827) : const Color(0xFFE5E7EB),
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
        ),
        labelPadding: const EdgeInsets.symmetric(horizontal: 4),
        visualDensity: const VisualDensity(horizontal: -2.5, vertical: -3),
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        onSelected: (_) => onTap(),
      ),
    );
  }
}
