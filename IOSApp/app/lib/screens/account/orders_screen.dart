import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/utils/order_formatters.dart';
import '../../models/order.dart';
import '../../providers/auth_provider.dart';
import '../../services/order_service.dart';
import '../../widgets/common/error_view.dart';
import '../../widgets/common/loading_view.dart';
import '../../widgets/orders/order_widgets.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key, this.focusOrderId});

  final String? focusOrderId;

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final _scrollController = ScrollController();
  final _orderKeys = <String, GlobalKey>{};

  List<Order> _orders = [];
  bool _loading = true;
  String? _error;
  String? _highlightOrderId;

  @override
  void initState() {
    super.initState();
    _highlightOrderId = widget.focusOrderId;
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final orders = await context.read<OrderService>().getUserOrders();
      if (!mounted) return;
      setState(() {
        _orders = orders;
        _loading = false;
      });
      _scrollToFocus();
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  void _scrollToFocus() {
    final focusId = _highlightOrderId;
    if (focusId == null || focusId.isEmpty) return;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final key = _orderKeys[focusId];
      final context = key?.currentContext;
      if (context != null) {
        Scrollable.ensureVisible(
          context,
          duration: const Duration(milliseconds: 400),
          curve: Curves.easeInOut,
          alignment: 0.3,
        );
      }
      Future.delayed(const Duration(milliseconds: 1600), () {
        if (mounted) setState(() => _highlightOrderId = null);
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.loading && !auth.isAuthenticated) {
      return Scaffold(
        backgroundColor: const Color(0xFFF4F5F7),
        appBar: AppBar(title: const Text('My Orders')),
        body: Center(
          child: FilledButton(
            onPressed: () => context.push('/login?redirect=${Uri.encodeComponent('/orders')}'),
            child: const Text('Sign in to view orders'),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF4F5F7),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF4F5F7),
        elevation: 0,
        scrolledUnderElevation: 0,
        title: const Text('My Orders'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.md),
            child: OutlinedButton(
              onPressed: () => context.push('/profile'),
              style: OutlinedButton.styleFrom(
                backgroundColor: Colors.white,
                side: BorderSide(color: Colors.grey.shade200),
              ),
              child: const Text('Profile', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
      body: _loading
          ? const LoadingView()
          : _error != null
              ? ErrorView(message: _error!, onRetry: _load)
              : _orders.isEmpty
                  ? _EmptyOrders(onBrowse: () => context.go('/videos'))
                  : RefreshIndicator(
                      onRefresh: _load,
                      child: ListView(
                        controller: _scrollController,
                        padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.xl),
                        children: [
                          Text(
                            'Your latest purchases, newest first',
                            style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          ..._orders.map((order) {
                            final key = _orderKeys.putIfAbsent(order.id, GlobalKey.new);
                            final highlighted = _highlightOrderId == order.id;
                            return Padding(
                              key: key,
                              padding: const EdgeInsets.only(bottom: AppSpacing.md),
                              child: _OrderCard(
                                order: order,
                                highlighted: highlighted,
                                onTap: () => context.push(
                                  '/orders/${order.id}?fromOrders=1',
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
    );
  }
}

class _EmptyOrders extends StatelessWidget {
  const _EmptyOrders({required this.onBrowse});

  final VoidCallback onBrowse;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Container(
          width: double.infinity,
          constraints: const BoxConstraints(maxWidth: 480),
          padding: const EdgeInsets.all(AppSpacing.xl),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: Colors.grey.shade100,
                child: Icon(Icons.shopping_bag_outlined, color: Colors.grey.shade500, size: 28),
              ),
              const SizedBox(height: AppSpacing.md),
              const Text('No orders yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'When you buy clips, your orders will appear here.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
              ),
              const SizedBox(height: AppSpacing.lg),
              FilledButton(
                onPressed: onBrowse,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                ),
                child: const Text('Browse Videos'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  const _OrderCard({
    required this.order,
    required this.highlighted,
    required this.onTap,
  });

  final Order order;
  final bool highlighted;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: highlighted ? Colors.grey.shade400 : Colors.grey.shade200,
              width: highlighted ? 2 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Wrap(
                spacing: 8,
                runSpacing: 4,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Text(
                    'Order #${order.shortOrderNumber}',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                  ),
                  PaymentStatusBadge(status: order.paymentStatus),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                OrderFormatters.formatDate(order.createdAt),
                style: TextStyle(fontSize: 12, color: Colors.grey.shade500),
              ),
              const SizedBox(height: AppSpacing.md),
              OrderListItemPreview(order: order),
            ],
          ),
        ),
      ),
    );
  }
}
