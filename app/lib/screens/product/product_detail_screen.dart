import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/utils/auth_gate.dart';
import '../../core/utils/formatters.dart';
import '../../models/product.dart';
import '../../providers/cart_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../widgets/cards/tight_product_card.dart';
import '../../widgets/common/error_view.dart';
import '../../widgets/common/loading_view.dart';
import '../../widgets/common/section_header.dart';

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({super.key, required this.productId});

  final String productId;

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  bool _cartBusy = false;

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
      appBar: AppBar(title: const Text('Product')),
      body: Consumer<CatalogProvider>(
        builder: (context, catalog, _) {
          if (catalog.loading && catalog.products.isEmpty) {
            return const LoadingView();
          }

          final product = catalog.getProductById(widget.productId);
          if (product == null) {
            return ErrorView(
              message: 'Product not found.',
              onRetry: () => catalog.loadCatalog(force: true),
            );
          }

          final related = catalog.getRelatedProducts(product.id);

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            children: [
              _MediaHero(product: product),
              const SizedBox(height: AppSpacing.md),
              Text(
                product.name,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 4),
              Text(
                product.category,
                style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                Formatters.currency(product.price),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF059669),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              _SpecGrid(product: product),
              if (product.description.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.md),
                Text(
                  product.description,
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade700, height: 1.4),
                ),
              ],
              const SizedBox(height: AppSpacing.lg),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _cartBusy || !product.isPurchasable
                          ? null
                          : () => _addToCart(context, product),
                      child: Text(_cartBusy ? 'Adding…' : 'Add to cart'),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: FilledButton(
                      onPressed: _cartBusy || !product.isPurchasable
                          ? null
                          : () => _buyNow(context, product),
                      child: const Text('Buy now'),
                    ),
                  ),
                ],
              ),
              if (related.isNotEmpty) ...[
                const SectionHeader(title: 'Related clips'),
                GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: AppSpacing.sm,
                    mainAxisSpacing: AppSpacing.sm,
                    childAspectRatio: 0.62,
                  ),
                  itemCount: related.length,
                  itemBuilder: (context, index) {
                    final item = related[index];
                    return TightProductCard(
                      product: item,
                      onTap: () => context.pushReplacement('/product/${item.id}'),
                    );
                  },
                ),
              ],
            ],
          );
        },
      ),
    );
  }

  Future<void> _addToCart(BuildContext context, Product product) async {
    final ok = await ensureAuthenticated(context, redirectTo: '/product/${product.id}');
    if (!ok || !mounted) return;

    setState(() => _cartBusy = true);
    try {
      await context.read<CartProvider>().addToCart(product.id);
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
    final ok = await ensureAuthenticated(context, redirectTo: '/product/${product.id}');
    if (!ok || !mounted) return;

    setState(() => _cartBusy = true);
    try {
      await context.read<CartProvider>().buyNow(product.id);
      if (mounted) context.push('/checkout');
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
}

class _MediaHero extends StatelessWidget {
  const _MediaHero({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final url = product.thumbnailUrl;
    return AspectRatio(
      aspectRatio: 16 / 10,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: url.isEmpty
            ? Container(color: const Color(0xFFF3F4F6))
            : CachedNetworkImage(imageUrl: url, fit: BoxFit.cover),
      ),
    );
  }
}

class _SpecGrid extends StatelessWidget {
  const _SpecGrid({required this.product});

  final Product product;

  @override
  Widget build(BuildContext context) {
    final specs = <String, String>{
      'Type': product.isVideo ? 'Video' : 'Image',
      'Clip ID': product.clipId.isEmpty ? '—' : product.clipId,
      'Quality': product.qualityLabel,
      'Brand': product.brand.isEmpty ? '—' : product.brand,
    };

    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      children: specs.entries.map((entry) {
        return Container(
          width: (MediaQuery.sizeOf(context).width - AppSpacing.lg * 2 - AppSpacing.sm) / 2,
          padding: const EdgeInsets.all(AppSpacing.sm),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                entry.key.toUpperCase(),
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.w700,
                  color: Colors.grey.shade500,
                  letterSpacing: 0.4,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                entry.value,
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
