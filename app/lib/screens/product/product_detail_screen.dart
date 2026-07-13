import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/constants/purchase.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/auth_gate.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/image_sizes.dart';
import '../../core/utils/product_share.dart';
import '../../models/image_size_info.dart';
import '../../models/product.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../widgets/cards/tight_product_card.dart';
import '../../widgets/common/loading_view.dart';
import '../../widgets/product/product_media_gallery.dart';
import '../../widgets/shell/shell_bottom_bar.dart';

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({super.key, required this.productId});

  final String productId;

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  bool _cartBusy = false;
  bool _sharing = false;
  String _selectedImageSize = '';
  Product? _product;
  bool _productLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadProduct());
  }

  Future<void> _loadProduct() async {
    final catalog = context.read<CatalogProvider>();
    setState(() {
      _productLoading = true;
    });

    await catalog.loadCatalog();
    final cached = catalog.getProductById(widget.productId);
    final fresh = await catalog.fetchProductById(widget.productId);
    final product = fresh ?? cached;

    if (!mounted) return;

    if (product == null) {
      setState(() {
        _product = null;
        _productLoading = false;
      });
      return;
    }

    await catalog.upsertProduct(product);

    if (!mounted) return;
    setState(() {
      _product = product;
      _productLoading = false;
      _selectedImageSize = product.imageSizes.isNotEmpty
          ? getDefaultImageSize(product.imageSizes)
          : '';
    });
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = shellBottomBarInset(context);

    return Scaffold(
      backgroundColor: const Color(0xFFF4F5F7),
      bottomNavigationBar: const ShellBottomBar(),
      body: Consumer<CatalogProvider>(
        builder: (context, catalog, _) {
          if (_productLoading && _product == null) {
            return const LoadingView(message: 'Loading product...');
          }

          final product = _product ?? catalog.getProductById(widget.productId);
          if (product == null) {
            return _NotFoundView(
              onBrowse: () => context.go('/videos'),
              onRetry: _loadProduct,
            );
          }

          final resolutionEntries = sortImageSizeEntries(product.imageSizes);
          final lowestEntry =
              resolutionEntries.isNotEmpty ? resolutionEntries.first : null;
          final selectedInfo = product.imageSizes[_selectedImageSize] ??
              lowestEntry?.value;
          final displayTierName =
              _selectedImageSize.isNotEmpty ? _selectedImageSize : '—';
          final displayPrice = selectedInfo?.price ?? product.price;
          final related = catalog.getRelatedProducts(product.id, limit: 32);
          final relatedPreview = related.take(19).toList();
          final isAuthenticated = context.watch<AuthProvider>().isAuthenticated;
          final licenseNote =
              product.videoInfo?['orientationNote']?.toString().trim() ?? '';

          return SafeArea(
            top: true,
            bottom: false,
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: _TopBar(onBack: () => context.pop()),
                ),
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    AppSpacing.sm,
                    AppSpacing.lg,
                    AppSpacing.lg,
                  ),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      ProductMediaGallery(product: product),
                      const SizedBox(height: AppSpacing.md),
                      _InfoCard(
                        product: product,
                        displayTierName: displayTierName,
                        displayPrice: displayPrice,
                        licenseNote: licenseNote,
                        isSharing: _sharing,
                        onShare: () => _shareProduct(product),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      _ActionButtons(
                        isPurchasable: product.isPurchasable,
                        isBusy: _cartBusy,
                        onAddToCart: () => _addToCart(context, product),
                        onBuyNow: () => _buyNow(context, product),
                      ),
                      if (!isAuthenticated && product.isPurchasable)
                        const Padding(
                          padding: EdgeInsets.only(top: AppSpacing.sm),
                          child: Text(
                            'To continue, please login or create account.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 11, color: Color(0xFF6B7280)),
                          ),
                        ),
                      const SizedBox(height: AppSpacing.md),
                      if (resolutionEntries.isNotEmpty)
                        _QualitySelector(
                          isVideo: product.isVideo,
                          entries: resolutionEntries,
                          selected: _selectedImageSize,
                          onSelected: (size) =>
                              setState(() => _selectedImageSize = size),
                        ),
                      const SizedBox(height: AppSpacing.md),
                      _SpecsSection(product: product),
                      if (relatedPreview.isNotEmpty) ...[
                        const SizedBox(height: AppSpacing.section),
                        const Text(
                          'More like this',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF111827),
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            crossAxisSpacing: AppSpacing.sm,
                            mainAxisSpacing: AppSpacing.xs,
                            childAspectRatio: 0.54,
                          ),
                          itemCount: relatedPreview.length + 1,
                          itemBuilder: (context, index) {
                            if (index == relatedPreview.length) {
                              return _ViewAllCard(
                                onTap: () => context.go('/videos'),
                              );
                            }
                            final item = relatedPreview[index];
                            return TightProductCard(
                              product: item,
                              onTap: () =>
                                  context.pushReplacement('/product/${item.id}'),
                            );
                          },
                        ),
                      ],
                    ]),
                  ),
                ),
                SliverPadding(
                  padding: EdgeInsets.only(bottom: bottomInset),
                  sliver: SliverToBoxAdapter(child: SizedBox(height: AppSpacing.sm)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _shareProduct(Product product) async {
    if (_sharing) return;
    setState(() => _sharing = true);
    try {
      await shareProduct(product);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Link shared')),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _sharing = false);
    }
  }

  void _showUnavailableModal() {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Video Not Available'),
        content: const Text(PurchaseMessages.unavailable),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  Future<void> _addToCart(BuildContext context, Product product) async {
    final ok = await ensureAuthenticated(
      context,
      redirectTo: '/product/${product.id}',
    );
    if (!ok || !mounted) return;

    if (!product.isPurchasable) {
      _showUnavailableModal();
      return;
    }

    setState(() => _cartBusy = true);
    try {
      await context.read<CartProvider>().addToCart(
            product.id,
            imageSize: _selectedImageSize,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Added to cart')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _cartBusy = false);
    }
  }

  Future<void> _buyNow(BuildContext context, Product product) async {
    final ok = await ensureAuthenticated(
      context,
      redirectTo: '/product/${product.id}',
    );
    if (!ok || !mounted) return;

    if (!product.isPurchasable) {
      _showUnavailableModal();
      return;
    }

    setState(() => _cartBusy = true);
    try {
      await context.read<CartProvider>().buyNow(
            product.id,
            imageSize: _selectedImageSize,
          );
      if (mounted) _goToCart(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _cartBusy = false);
    }
  }

  void _goToCart(BuildContext context) {
    ShellTabState.noteTabIndex(2);
    final router = GoRouter.of(context);
    if (router.canPop()) {
      router.pop();
    }
    router.go('/cart');
  }
}

class _TopBar extends StatelessWidget {
  const _TopBar({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF4F5F7),
      padding: EdgeInsets.fromLTRB(
        AppSpacing.sm,
        AppSpacing.xs,
        AppSpacing.lg,
        6,
      ),
      child: Row(
        children: [
          TextButton.icon(
            onPressed: onBack,
            icon: const Icon(Icons.arrow_back, size: 18),
            label: const Text('Back'),
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFF4B5563),
            ),
          ),
          const Spacer(),
          const Text(
            'PREMIUM VIDEO WITH EDITORIAL LICENSE',
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
              color: Color(0xFF9CA3AF),
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.product,
    required this.displayTierName,
    required this.displayPrice,
    required this.licenseNote,
    required this.isSharing,
    required this.onShare,
  });

  final Product product;
  final String displayTierName;
  final num displayPrice;
  final String licenseNote;
  final bool isSharing;
  final VoidCallback onShare;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: const BoxDecoration(
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
              gradient: LinearGradient(
                colors: [Color(0xFF111827), Color(0xFF1F2937)],
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    if (product.brand.isNotEmpty) ...[
                      _AmberBadge(text: product.brand),
                      const SizedBox(width: 6),
                    ],
                    _AmberBadge(
                      text: product.isVideo ? 'Stock Video' : 'Stock Image',
                    ),
                    if (product.isVideo && product.durationLabel.isNotEmpty) ...[
                      const SizedBox(width: 6),
                      Flexible(
                        child: _AmberBadge(
                          text: product.durationLabel,
                          fontSize: 11,
                        ),
                      ),
                    ],
                    const Spacer(),
                    SizedBox(
                      height: _AmberBadge.height,
                      child: TextButton.icon(
                        onPressed: isSharing ? null : onShare,
                        icon: const Icon(Icons.share_outlined, size: 15),
                        label: const Text('Share', style: TextStyle(fontSize: 11)),
                        style: TextButton.styleFrom(
                          foregroundColor: Colors.white,
                          backgroundColor: Colors.white.withValues(alpha: 0.1),
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          minimumSize: const Size(0, _AmberBadge.height),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  product.name,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    height: 1.25,
                  ),
                ),
                if (product.clipId.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Clip ID · ${product.clipId}',
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.55),
                      fontSize: 11,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
                const SizedBox(height: 4),
                Text(
                  '${product.category} · ${getProductTypeLabel(product.isVideo)}',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.65),
                    fontSize: 13,
                  ),
                ),
                if (product.description.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    product.description,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.75),
                      fontSize: 13,
                      height: 1.45,
                    ),
                  ),
                ],
                const SizedBox(height: AppSpacing.md),
                Divider(color: Colors.white.withValues(alpha: 0.1)),
                const SizedBox(height: AppSpacing.sm),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'LICENSE FROM · $displayTierName',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.5),
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1.1,
                            ),
                          ),
                          Text(
                            Formatters.currency(displayPrice),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 28,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (licenseNote.isNotEmpty)
                      Text(
                        licenseNote,
                        textAlign: TextAlign.right,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.5),
                          fontSize: 11,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AmberBadge extends StatelessWidget {
  const _AmberBadge({
    required this.text,
    this.fontSize = 9,
  });

  static const double height = 32;

  final String text;
  final double fontSize;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: const Color(0xFFFBBF24).withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text.toUpperCase(),
        style: TextStyle(
          fontSize: fontSize,
          fontWeight: FontWeight.w800,
          color: const Color(0xFF111827),
          letterSpacing: 0.3,
          height: 1,
        ),
      ),
    );
  }
}

class _ActionButtons extends StatelessWidget {
  const _ActionButtons({
    required this.isPurchasable,
    required this.isBusy,
    required this.onAddToCart,
    required this.onBuyNow,
  });

  final bool isPurchasable;
  final bool isBusy;
  final VoidCallback onAddToCart;
  final VoidCallback onBuyNow;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FilledButton.icon(
          onPressed: !isPurchasable || isBusy ? null : onAddToCart,
          icon: const Icon(Icons.shopping_cart_outlined, size: 18),
          label: Text(isBusy ? 'Please wait…' : 'Add to Cart'),
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFF111827),
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        OutlinedButton(
          onPressed: !isPurchasable || isBusy ? null : onBuyNow,
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFF111827),
            side: const BorderSide(color: Color(0xFF111827), width: 2),
            padding: const EdgeInsets.symmetric(vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Flexible(
                child: Text(
                  'Download Video & Licensed',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                ),
              ),
              SizedBox(width: 6),
              Icon(Icons.arrow_forward, size: 16),
            ],
          ),
        ),
      ],
    );
  }
}

class _QualitySelector extends StatelessWidget {
  const _QualitySelector({
    required this.isVideo,
    required this.entries,
    required this.selected,
    required this.onSelected,
  });

  final bool isVideo;
  final List<MapEntry<String, ProductImageSize>> entries;
  final String selected;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.sm,
          AppSpacing.md,
          AppSpacing.md,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Select download quality',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF111827),
                    ),
                  ),
                ),
                Text(
                  isVideo ? 'Video + stills' : 'Licensed file',
                  style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
                ),
              ],
            ),
            const SizedBox(height: 8),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
                mainAxisExtent: 68,
              ),
              itemCount: entries.length,
              itemBuilder: (context, index) {
                final entry = entries[index];
                final isSelected = selected == entry.key;
                return _QualityTile(
                  name: entry.key,
                  info: entry.value,
                  isSelected: isSelected,
                  onTap: () => onSelected(entry.key),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _QualityTile extends StatelessWidget {
  const _QualityTile({
    required this.name,
    required this.info,
    required this.isSelected,
    required this.onTap,
  });

  final String name;
  final ProductImageSize info;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected ? const Color(0xFF111827) : Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? const Color(0xFF111827) : Colors.grey.shade200,
            ),
          ),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              if (isSelected)
                const Positioned(
                  right: 0,
                  top: 0,
                  child: Icon(Icons.check_circle, color: Colors.white, size: 14),
                ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    Formatters.currency(info.price),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                      color: isSelected ? Colors.white : const Color(0xFF111827),
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        name,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: isSelected ? Colors.white : const Color(0xFF111827),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          info.size,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 10,
                            color: isSelected
                                ? Colors.white.withValues(alpha: 0.7)
                                : Colors.grey.shade500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SpecsSection extends StatelessWidget {
  const _SpecsSection({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final specs = _buildSpecs(context, product);

    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (specs.isNotEmpty) ...[
              Text(
                product.isVideo ? 'Clip specifications' : 'File details',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF111827),
                ),
              ),
              const SizedBox(height: 6),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 2.8,
                ),
                itemCount: specs.length,
                itemBuilder: (context, index) {
                  final spec = specs[index];
                  return _SpecItem(
                    label: spec.label,
                    value: spec.value,
                    onTap: spec.onTap,
                    isArtist: spec.isArtist,
                  );
                },
              ),
              const SizedBox(height: AppSpacing.md),
            ],
            _LicenseNote(),
          ],
        ),
      ),
    );
  }

  List<_SpecData> _buildSpecs(BuildContext context, Product product) {
    final info = product.videoInfo ?? {};
    final specs = <_SpecData>[];

    final actorIds = product.resolvedActorIds;
    final actorNames = product.resolvedActorNames;

    for (var index = 0; index < actorNames.length; index++) {
      final artistName = actorNames[index];
      final actorId = index < actorIds.length ? actorIds[index] : null;
      specs.add(
        _SpecData(
          label: 'Artist',
          value: artistName,
          isArtist: true,
          onTap: () => context.go(
            actorId != null && actorId.isNotEmpty
                ? '/videos?actor=${Uri.encodeComponent(actorId)}'
                : '/videos?search=${Uri.encodeComponent(artistName)}',
          ),
        ),
      );
    }

    if (product.isVideo) {
      _addSpec(specs, 'Quality', info['quality']?.toString());
      _addSpec(specs, 'Frame rate', info['fps']?.toString());
      _addSpec(specs, 'Duration', info['duration']?.toString());
      _addSpec(specs, 'Master size', info['size']?.toString());
      _addSpec(specs, 'Format', info['format']?.toString());
    } else {
      _addSpec(specs, 'Quality', info['quality']?.toString());
      _addSpec(specs, 'File size', info['size']?.toString());
      _addSpec(
        specs,
        'Format',
        info['format']?.toString().isNotEmpty == true
            ? info['format']!.toString()
            : 'JPEG / PNG',
      );
    }

    return specs;
  }

  void _addSpec(List<_SpecData> specs, String label, String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) return;
    specs.add(_SpecData(label: label, value: trimmed));
  }
}

class _SpecData {
  const _SpecData({
    required this.label,
    required this.value,
    this.onTap,
    this.isArtist = false,
  });

  final String label;
  final String value;
  final VoidCallback? onTap;
  final bool isArtist;
}

class _SpecItem extends StatelessWidget {
  const _SpecItem({
    required this.label,
    required this.value,
    this.onTap,
    this.isArtist = false,
  });

  final String label;
  final String value;
  final VoidCallback? onTap;
  final bool isArtist;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label.toUpperCase(),
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
            color: Colors.grey.shade500,
          ),
        ),
        const SizedBox(height: 2),
        if (onTap != null)
          GestureDetector(
            onTap: onTap,
            child: Text(
              value,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: isArtist ? const Color(0xFF2563EB) : const Color(0xFF111827),
                decoration: TextDecoration.none,
              ),
            ),
          )
        else
          Text(
            value,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: Color(0xFF111827),
            ),
          ),
      ],
    );
  }
}

class _LicenseNote extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return RichText(
      text: TextSpan(
        style: TextStyle(
          fontSize: 11,
          height: 1.45,
          color: Colors.grey.shade600,
        ),
        children: [
          TextSpan(
            text: 'Note: ',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: Colors.grey.shade700,
            ),
          ),
          const TextSpan(
            text:
                'Purchase the video with license you will receive the video without Watermark in email which will be completely raw footage with original size. Before purchasing videos, please read our ',
          ),
          _linkSpan(context, 'License Information Policy', '/license-information-policy'),
          const TextSpan(text: ', '),
          _linkSpan(context, 'Editorial Policy', '/editorial-policy'),
          const TextSpan(text: ' and '),
          _linkSpan(context, 'Terms & Conditions', '/terms-and-conditions'),
          const TextSpan(text: '.'),
        ],
      ),
    );
  }

  TextSpan _linkSpan(BuildContext context, String label, String path) {
    return TextSpan(
      text: label,
      style: const TextStyle(
        fontWeight: FontWeight.w600,
        color: Color(0xFF1F2937),
      ),
      recognizer: TapGestureRecognizer()..onTap = () => context.push(path),
    );
  }
}

class _ViewAllCard extends StatelessWidget {
  const _ViewAllCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF9FAFB),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: Colors.grey.shade300,
            width: 2,
            strokeAlign: BorderSide.strokeAlignInside,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.grey.shade400),
                color: Colors.white,
              ),
              child: const Icon(Icons.arrow_forward_ios, size: 16),
            ),
            const SizedBox(height: 8),
            const Text(
              'View All',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotFoundView extends StatelessWidget {
  const _NotFoundView({required this.onBrowse, required this.onRetry});

  final VoidCallback onBrowse;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: const Color(0xFF030712),
      child: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'Clip Not Found',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'This footage may have been removed from the library.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey.shade400),
                ),
                const SizedBox(height: AppSpacing.lg),
                FilledButton(
                  onPressed: onBrowse,
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF111827),
                  ),
                  child: const Text('Browse Footage'),
                ),
                TextButton(
                  onPressed: onRetry,
                  child: const Text('Retry', style: TextStyle(color: Colors.white70)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
