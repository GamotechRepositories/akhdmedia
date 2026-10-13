import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/utils/auth_gate.dart';
import '../../core/utils/formatters.dart';
import '../../models/cart_models.dart';
import '../../providers/cart_provider.dart';
import '../../services/api_client.dart';
import '../../widgets/common/loading_view.dart';
import '../shell/main_shell.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  String? _removingId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CartProvider>().loadCart();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const StoreAppBar(title: 'Cart'),
      body: Consumer<CartProvider>(
        builder: (context, cartProvider, _) {
          if (cartProvider.loading) {
            return const LoadingView();
          }

          final cart = cartProvider.cart;
          if (cart.isEmpty) {
            return _EmptyCart(onShop: () => context.go('/videos'));
          }

          return Column(
            children: [
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  itemCount: cart.items.length + 1,
                  separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.sm),
                  itemBuilder: (context, index) {
                    if (index == cart.items.length) {
                      return _PromoCodeCard(
                        appliedCode: cart.appliedPromoCode,
                        discountAmount: cart.discountAmount,
                      );
                    }
                    final item = cart.items[index];
                    return _CartItemCard(
                      item: item,
                      removing: _removingId == item.id,
                      onRemove: () => _removeItem(item.id),
                      onDecrease: () => _updateQty(item, item.quantity - 1),
                      onIncrease: () => _updateQty(item, item.quantity + 1),
                      onTap: () {
                        final id = item.product?.id ?? item.productId;
                        if (id.isNotEmpty) context.push('/product/$id');
                      },
                    );
                  },
                ),
              ),
              _CartSummary(
                subtotal: cart.displaySubtotal,
                gstTotal: cart.displayGstTotal,
                discountAmount: cart.discountAmount,
                total: cart.displayTotal,
                itemCount: cart.itemCount,
                onCheckout: () => context.push('/checkout'),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _removeItem(String itemId) async {
    if (_removingId != null) return;
    setState(() => _removingId = itemId);
    try {
      await context.read<CartProvider>().removeItem(itemId);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    } finally {
      if (mounted) setState(() => _removingId = null);
    }
  }

  Future<void> _updateQty(CartItem item, int qty) async {
    if (qty < 1) return;
    try {
      await context.read<CartProvider>().updateQuantity(item.id, qty);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }
}

class _EmptyCart extends StatelessWidget {
  const _EmptyCart({required this.onShop});

  final VoidCallback onShop;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.shopping_cart_outlined, size: 56, color: Colors.grey.shade400),
            const SizedBox(height: AppSpacing.md),
            const Text(
              'Your cart is empty',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Add clips to continue shopping.',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.lg),
            FilledButton(
              onPressed: onShop,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
              ),
              child: const Text('Browse videos'),
            ),
          ],
        ),
      ),
    );
  }
}

class _CartItemCard extends StatelessWidget {
  const _CartItemCard({
    required this.item,
    required this.removing,
    required this.onRemove,
    required this.onDecrease,
    required this.onIncrease,
    required this.onTap,
  });

  final CartItem item;
  final bool removing;
  final VoidCallback onRemove;
  final VoidCallback onDecrease;
  final VoidCallback onIncrease;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final product = item.product;
    final thumb = product?.thumbnailUrl ?? '';

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: thumb.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: thumb,
                        width: 72,
                        height: 90,
                        fit: BoxFit.cover,
                      )
                    : Container(
                        width: 72,
                        height: 90,
                        color: Colors.grey.shade200,
                        child: const Icon(Icons.movie_outlined),
                      ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product?.name ?? 'Product',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      Formatters.currency(item.basePrice > 0 ? item.basePrice : item.price),
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF059669),
                      ),
                    ),
                    Text(
                      'excl. GST',
                      style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        _QtyButton(icon: Icons.remove, onTap: onDecrease),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          child: Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.w700)),
                        ),
                        _QtyButton(icon: Icons.add, onTap: onIncrease),
                        const Spacer(),
                        IconButton(
                          onPressed: removing ? null : onRemove,
                          icon: removing
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2),
                                )
                              : const Icon(Icons.delete_outline, size: 20),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  const _QtyButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Icon(icon, size: 16),
      ),
    );
  }
}

class _CartSummary extends StatelessWidget {
  const _CartSummary({
    required this.subtotal,
    required this.gstTotal,
    required this.discountAmount,
    required this.total,
    required this.itemCount,
    required this.onCheckout,
  });

  final num subtotal;
  final num gstTotal;
  final num discountAmount;
  final num total;
  final int itemCount;
  final VoidCallback onCheckout;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              '$itemCount items',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            const SizedBox(height: AppSpacing.sm),
            _SummaryRow(
              label: 'Subtotal',
              value: Formatters.currency(subtotal),
            ),
            if (discountAmount > 0) ...[
              const SizedBox(height: 6),
              _SummaryRow(
                label: 'Promo discount',
                value: '-${Formatters.currency(discountAmount)}',
                valueColor: const Color(0xFF059669),
              ),
            ],
            const SizedBox(height: 6),
            _SummaryRow(
              label: 'GST',
              value: Formatters.currency(gstTotal),
            ),
            const SizedBox(height: AppSpacing.sm),
            const Divider(height: 1),
            const SizedBox(height: AppSpacing.sm),
            _SummaryRow(
              label: 'Total payable',
              value: Formatters.currency(total),
              labelStyle: const TextStyle(fontWeight: FontWeight.w800),
              valueStyle: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: Color(0xFF059669),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            FilledButton(
              onPressed: () async {
                final ok = await ensureAuthenticated(context, redirectTo: '/checkout');
                if (ok && context.mounted) onCheckout();
              },
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
              ),
              child: const Text('Proceed to checkout'),
            ),
            const SizedBox(height: AppSpacing.md),
            const _SecurePaymentFooter(),
          ],
        ),
      ),
    );
  }
}

class _PromoCodeCard extends StatefulWidget {
  const _PromoCodeCard({
    required this.appliedCode,
    required this.discountAmount,
  });

  final String appliedCode;
  final num discountAmount;

  @override
  State<_PromoCodeCard> createState() => _PromoCodeCardState();
}

class _PromoCodeCardState extends State<_PromoCodeCard> {
  final _controller = TextEditingController();
  late bool _expanded = widget.appliedCode.isNotEmpty;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _apply() async {
    final code = _controller.text.trim().toUpperCase();
    if (code.isEmpty) {
      setState(() => _error = 'Enter a promo code');
      return;
    }

    final ok = await ensureAuthenticated(context, redirectTo: '/cart');
    if (!ok || !mounted) return;

    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context.read<CartProvider>().applyPromoCode(code);
      _controller.clear();
    } catch (e) {
      if (mounted) setState(() => _error = ApiClient.unwrapError(e).toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _remove() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context.read<CartProvider>().removePromoCode();
    } catch (e) {
      if (mounted) setState(() => _error = ApiClient.unwrapError(e).toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final applied = widget.appliedCode.isNotEmpty;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            InkWell(
              onTap: () => setState(() => _expanded = !_expanded),
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    const Icon(Icons.local_offer_outlined, size: 18, color: Color(0xFF2563EB)),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        'Do you have a promo code?',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ),
                    AnimatedRotation(
                      turns: _expanded ? 0.5 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: const Icon(Icons.keyboard_arrow_down, size: 20),
                    ),
                  ],
                ),
              ),
            ),
            if (_expanded) ...[
              const SizedBox(height: AppSpacing.sm),
              if (applied)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFECFDF5),
                    border: Border.all(color: const Color(0xFFA7F3D0)),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${widget.appliedCode} applied',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF065F46),
                              ),
                            ),
                            Text(
                              'You save ${Formatters.currency(widget.discountAmount)}',
                              style: const TextStyle(fontSize: 11, color: Color(0xFF047857)),
                            ),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: _loading ? null : _remove,
                        style: TextButton.styleFrom(foregroundColor: const Color(0xFF065F46)),
                        child: _loading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('REMOVE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                )
              else
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        enabled: !_loading,
                        textCapitalization: TextCapitalization.characters,
                        textInputAction: TextInputAction.done,
                        onSubmitted: (_) => _apply(),
                        onChanged: (_) {
                          if (_error != null) setState(() => _error = null);
                        },
                        decoration: InputDecoration(
                          hintText: 'Enter code',
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox(
                      height: 44,
                      child: FilledButton.tonal(
                        onPressed: _loading ? null : _apply,
                        child: _loading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('APPLY', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ],
                ),
              if (_error != null) ...[
                const SizedBox(height: 6),
                Text(
                  _error!,
                  style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626)),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }
}

class _SecurePaymentFooter extends StatelessWidget {
  const _SecurePaymentFooter();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.lock_outline, size: 13, color: Colors.grey.shade600),
            const SizedBox(width: 4),
            Text(
              'Secure Payment',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _PaymentBadge(
              label: 'Razorpay',
              child: Text.rich(
                TextSpan(
                  children: [
                    TextSpan(text: 'Razor', style: TextStyle(color: Color(0xFF072654))),
                    TextSpan(text: 'pay', style: TextStyle(color: Color(0xFF3395FF))),
                  ],
                ),
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic),
              ),
            ),
            SizedBox(width: 10),
            _PaymentBadge(
              label: 'PayPal',
              child: Text.rich(
                TextSpan(
                  children: [
                    TextSpan(text: 'Pay', style: TextStyle(color: Color(0xFF003087))),
                    TextSpan(text: 'Pal', style: TextStyle(color: Color(0xFF009CDE))),
                  ],
                ),
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, fontStyle: FontStyle.italic),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _PaymentBadge extends StatelessWidget {
  const _PaymentBadge({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      child: Container(
        height: 30,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(6),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 2,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: ExcludeSemantics(child: child),
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({
    required this.label,
    required this.value,
    this.labelStyle,
    this.valueStyle,
    this.valueColor,
  });

  final String label;
  final String value;
  final TextStyle? labelStyle;
  final TextStyle? valueStyle;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: labelStyle ?? TextStyle(fontSize: 13, color: Colors.grey.shade700),
        ),
        Text(
          value,
          style: valueStyle ??
              TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: valueColor ?? const Color(0xFF111827),
              ),
        ),
      ],
    );
  }
}
