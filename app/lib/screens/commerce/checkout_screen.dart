import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/constants/brand.dart';
import '../../core/constants/site_content.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/formatters.dart';
import '../../models/billing_address.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/order_service.dart';
import '../../services/razorpay_checkout.dart';
import '../../widgets/common/loading_view.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _otherReasonCtrl = TextEditingController();
  final _razorpay = RazorpayCheckout();

  int _step = 0;
  bool _loadingProfile = true;
  bool _processing = false;
  bool _acceptedTerms = false;
  String? _selectedReason;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  Future<void> _bootstrap() async {
    final auth = context.read<AuthProvider>();
    final orders = context.read<OrderService>();

    if (!auth.isAuthenticated) {
      if (mounted) context.go('/login?redirect=${Uri.encodeComponent('/checkout')}');
      return;
    }

    final cart = context.read<CartProvider>();
    if (!cart.loading && cart.cart.isEmpty) {
      if (mounted) context.go('/cart');
      return;
    }

    try {
      if (auth.user != null) {
        _nameCtrl.text = auth.user!.name;
        _emailCtrl.text = auth.user!.email;
        _phoneCtrl.text = auth.user!.phone;
      } else {
        final profile = await orders.getCheckoutProfile();
        if (profile != null) {
          _nameCtrl.text = profile.name;
          _emailCtrl.text = profile.email;
          _phoneCtrl.text = profile.phone;
          if (profile.purchaseReasons.isNotEmpty) {
            _selectedReason = profile.purchaseReasons.first;
          }
          _otherReasonCtrl.text = profile.purchaseReasonOther;
        }
      }
    } catch (_) {
      // Profile prefill is optional.
    } finally {
      if (mounted) setState(() => _loadingProfile = false);
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _otherReasonCtrl.dispose();
    _razorpay.dispose();
    super.dispose();
  }

  BillingAddress get _billing => BillingAddress(
        name: _nameCtrl.text,
        email: _emailCtrl.text,
        phone: _phoneCtrl.text,
        purchaseReasons: _selectedReason == null ? [] : [_selectedReason!],
        purchaseReasonOther: _otherReasonCtrl.text,
      );

  String? _validateBilling() {
    if (_nameCtrl.text.trim().isEmpty) return 'Please enter your full name';
    if (_emailCtrl.text.trim().isEmpty) return 'Please enter your email';
    if (_phoneCtrl.text.trim().isEmpty) return 'Please enter your phone number';
    if (_selectedReason == null) return 'Please select where you will use the video';
    if (_selectedReason == 'other' && _otherReasonCtrl.text.trim().isEmpty) {
      return 'Please describe how you will use the video';
    }
    if (!_acceptedTerms) return 'Please accept the terms and conditions';
    return null;
  }

  void _continueToSummary() {
    final err = _validateBilling();
    if (err != null) {
      setState(() => _error = err);
      return;
    }
    setState(() {
      _error = null;
      _step = 1;
    });
  }

  Future<void> _placeOrder() async {
    final validation = _validateBilling();
    if (validation != null) {
      setState(() => _error = validation);
      return;
    }

    setState(() {
      _processing = true;
      _error = null;
    });

    final orders = context.read<OrderService>();
    final cartProvider = context.read<CartProvider>();

    try {
      await orders.saveCheckoutProfile(_billing);
      final result = await orders.createOrder(_billing);

      setState(() => _processing = false);

      final payment = await _razorpay.open(
        keyId: result.razorpay.keyId,
        amount: result.razorpay.amount,
        currency: result.razorpay.currency,
        razorpayOrderId: result.razorpay.orderId,
        name: Brand.name,
        description: 'Order ${result.order.orderNumber}',
        customerName: _billing.name,
        customerEmail: _billing.email,
        customerPhone: _billing.phone,
      );

      setState(() => _processing = true);

      await orders.verifyRazorpayPayment(
        orderId: result.order.id,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        razorpaySignature: payment.razorpaySignature,
      );

      await cartProvider.clearCart();

      if (mounted) {
        context.go('/order-success?orderId=${result.order.id}');
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _processing = false;
          _error = e.toString().replaceFirst('Exception: ', '');
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_step == 0 ? 'Billing' : 'Payment'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (_step == 1) {
              setState(() => _step = 0);
            } else {
              context.pop();
            }
          },
        ),
      ),
      body: Consumer<CartProvider>(
        builder: (context, cartProvider, _) {
          if (_loadingProfile || cartProvider.loading) {
            return const LoadingView();
          }

          if (cartProvider.cart.isEmpty) {
            return Center(
              child: FilledButton(
                onPressed: () => context.go('/cart'),
                child: const Text('Back to cart'),
              ),
            );
          }

          return Column(
            children: [
              _StepIndicator(step: _step),
              if (_error != null)
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.sm),
                  child: Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12)),
                ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  children: [
                    if (_step == 0) ..._billingFields() else ..._summary(cartProvider),
                  ],
                ),
              ),
              _BottomBar(
                processing: _processing,
                step: _step,
                total: cartProvider.cart.total,
                onPrimary: _step == 0 ? _continueToSummary : _placeOrder,
              ),
            ],
          );
        },
      ),
    );
  }

  List<Widget> _billingFields() {
    return [
      TextField(
        controller: _nameCtrl,
        decoration: const InputDecoration(labelText: 'Full name'),
        textInputAction: TextInputAction.next,
      ),
      const SizedBox(height: AppSpacing.sm),
      TextField(
        controller: _emailCtrl,
        decoration: const InputDecoration(labelText: 'Email'),
        keyboardType: TextInputType.emailAddress,
        textInputAction: TextInputAction.next,
      ),
      const SizedBox(height: AppSpacing.sm),
      TextField(
        controller: _phoneCtrl,
        decoration: const InputDecoration(labelText: 'Phone'),
        keyboardType: TextInputType.phone,
        textInputAction: TextInputAction.next,
      ),
      const SizedBox(height: AppSpacing.md),
      const Text('Where will you use this content?', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
      const SizedBox(height: AppSpacing.sm),
      ...SiteContent.purchaseReasons.map((reason) {
        return RadioListTile<String>(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: Text(reason.$2, style: const TextStyle(fontSize: 13)),
          value: reason.$1,
          groupValue: _selectedReason,
          onChanged: (value) => setState(() => _selectedReason = value),
        );
      }),
      if (_selectedReason == 'other') ...[
        const SizedBox(height: AppSpacing.sm),
        TextField(
          controller: _otherReasonCtrl,
          decoration: const InputDecoration(labelText: 'Describe your use'),
          maxLines: 2,
        ),
      ],
      const SizedBox(height: AppSpacing.md),
      CheckboxListTile(
        contentPadding: EdgeInsets.zero,
        value: _acceptedTerms,
        onChanged: (v) => setState(() => _acceptedTerms = v ?? false),
        title: Wrap(
          children: [
            const Text('I agree to the ', style: TextStyle(fontSize: 12)),
            GestureDetector(
              onTap: () => context.push('/terms-and-conditions'),
              child: const Text('terms & conditions', style: TextStyle(fontSize: 12, decoration: TextDecoration.underline)),
            ),
          ],
        ),
        controlAffinity: ListTileControlAffinity.leading,
      ),
    ];
  }

  List<Widget> _summary(CartProvider cartProvider) {
    return [
      const Text('Order summary', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
      const SizedBox(height: AppSpacing.sm),
      ...cartProvider.cart.items.map((item) {
        return ListTile(
          dense: true,
          contentPadding: EdgeInsets.zero,
          title: Text(item.product?.name ?? 'Item', style: const TextStyle(fontSize: 13)),
          subtitle: Text('Qty ${item.quantity}'),
          trailing: Text(Formatters.currency(item.lineTotal), style: const TextStyle(fontWeight: FontWeight.w700)),
        );
      }),
      const Divider(),
      Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text('Total', style: TextStyle(fontWeight: FontWeight.w800)),
          Text(
            Formatters.currency(cartProvider.cart.total),
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF059669)),
          ),
        ],
      ),
      const SizedBox(height: AppSpacing.md),
      Text(
        'Pay securely with UPI, card, or net banking via Razorpay.',
        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
      ),
    ];
  }
}

class _StepIndicator extends StatelessWidget {
  const _StepIndicator({required this.step});

  final int step;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _StepDot(label: '1 Billing', active: step == 0, done: step > 0),
          Container(width: 32, height: 1, color: Colors.grey.shade300),
          _StepDot(label: '2 Payment', active: step == 1, done: false),
        ],
      ),
    );
  }
}

class _StepDot extends StatelessWidget {
  const _StepDot({required this.label, required this.active, required this.done});

  final String label;
  final bool active;
  final bool done;

  @override
  Widget build(BuildContext context) {
    final color = active || done ? const Color(0xFF111827) : Colors.grey.shade300;
    return Row(
      children: [
        CircleAvatar(
          radius: 12,
          backgroundColor: color,
          child: done
              ? const Icon(Icons.check, size: 14, color: Colors.white)
              : Text(label[0], style: const TextStyle(color: Colors.white, fontSize: 11)),
        ),
        const SizedBox(width: 6),
        Text(label.substring(2), style: TextStyle(fontSize: 12, fontWeight: active ? FontWeight.w700 : FontWeight.w500)),
      ],
    );
  }
}

class _BottomBar extends StatelessWidget {
  const _BottomBar({
    required this.processing,
    required this.step,
    required this.total,
    required this.onPrimary,
  });

  final bool processing;
  final int step;
  final num total;
  final VoidCallback onPrimary;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Total'),
                Text(Formatters.currency(total), style: const TextStyle(fontWeight: FontWeight.w900)),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            FilledButton(
              onPressed: processing ? null : onPrimary,
              child: processing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(step == 0 ? 'Continue' : 'Pay now'),
            ),
          ],
        ),
      ),
    );
  }
}
