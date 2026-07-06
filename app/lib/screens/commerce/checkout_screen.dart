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
import '../../services/paypal_checkout.dart';
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
  final _paypal = PayPalCheckout();

  int _step = 0;
  bool _loadingProfile = true;
  bool _processing = false;
  String _paymentProvider = 'razorpay';
  bool _acceptedTerms = false;
  bool _acceptedLicensePolicy = false;
  String? _selectedReason;
  String? _error;
  Map<String, dynamic> _paymentConfig = {};

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
    }

    try {
      _paymentConfig = await orders.getPaymentConfig();
    } catch (_) {
      // Payment config is optional for Razorpay-only checkout.
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
    if (!_acceptedLicensePolicy) {
      return 'Please accept the License Information Policy';
    }
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
      final result = await orders.createOrder(_billing, paymentProvider: _paymentProvider);

      if (_paymentProvider == 'paypal') {
        final paypal = result.paypal;
        if (paypal == null || paypal.approvalUrl.isEmpty) {
          throw Exception('PayPal is not available right now');
        }

        setState(() => _processing = false);

        final paypalOrderId = await _paypal.open(
          context: context,
          approvalUrl: paypal.approvalUrl,
        );

        setState(() => _processing = true);

        await orders.capturePayPalPayment(
          orderId: result.order.id,
          paypalOrderId: paypalOrderId,
        );
      } else {
        final razorpay = result.razorpay;
        if (razorpay == null) {
          throw Exception('Razorpay is not available right now');
        }

        setState(() => _processing = false);

        final payment = await _razorpay.open(
          keyId: razorpay.keyId,
          amount: razorpay.amount,
          currency: razorpay.currency,
          razorpayOrderId: razorpay.orderId,
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
      }

      await cartProvider.clearCart();

      if (mounted) {
        context.go('/orders/${result.order.id}');
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
            const Text('I have read ', style: TextStyle(fontSize: 12)),
            GestureDetector(
              onTap: () => context.push('/terms-and-conditions'),
              child: const Text(
                'Terms & Conditions',
                style: TextStyle(fontSize: 12, decoration: TextDecoration.underline),
              ),
            ),
            const Text(' and agree', style: TextStyle(fontSize: 12)),
          ],
        ),
        controlAffinity: ListTileControlAffinity.leading,
      ),
      CheckboxListTile(
        contentPadding: EdgeInsets.zero,
        value: _acceptedLicensePolicy,
        onChanged: (v) => setState(() => _acceptedLicensePolicy = v ?? false),
        title: Wrap(
          children: [
            const Text('I have read ', style: TextStyle(fontSize: 12)),
            GestureDetector(
              onTap: () => context.push('/license-information-policy'),
              child: const Text(
                'License Information Policy',
                style: TextStyle(fontSize: 12, decoration: TextDecoration.underline),
              ),
            ),
            const Text(' and agree', style: TextStyle(fontSize: 12)),
          ],
        ),
        controlAffinity: ListTileControlAffinity.leading,
      ),
    ];
  }

  double _paypalUsdAmount(num inrTotal) {
    final paypal = _paymentConfig['paypal'];
    final rate = paypal is Map && paypal['usdInrRate'] is num
        ? (paypal['usdInrRate'] as num).toDouble()
        : 84.0;
    final usd = inrTotal / rate;
    return double.parse((usd < 0.01 ? 0.01 : usd).toStringAsFixed(2));
  }

  String _liveRateLabel() {
    final paypal = _paymentConfig['paypal'];
    if (paypal is Map && paypal['usdInrRateSource'] == 'live') {
      return 'Live rate ';
    }
    return 'Est. rate ';
  }

  List<Widget> _summary(CartProvider cartProvider) {
    final inrTotal = cartProvider.cart.total;
    final paypalUsd = _paymentProvider == 'paypal' ? _paypalUsdAmount(inrTotal) : 0.0;
    final paypalRate = (_paymentConfig['paypal'] is Map
            ? (_paymentConfig['paypal'] as Map)['usdInrRate']
            : null) is num
        ? ((_paymentConfig['paypal'] as Map)['usdInrRate'] as num).toDouble()
        : 84.0;

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
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (_paymentProvider == 'paypal') ...[
                Text(
                  '\$${paypalUsd.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF059669),
                  ),
                ),
                Text(
                  '≈ ${Formatters.currency(inrTotal)} · ${_liveRateLabel()}₹${paypalRate.toStringAsFixed(2)}/USD',
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                ),
              ] else
                Text(
                  Formatters.currency(inrTotal),
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF059669)),
                ),
            ],
          ),
        ],
      ),
      const SizedBox(height: AppSpacing.md),
      const Text('Payment method', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
      const SizedBox(height: AppSpacing.sm),
      _PaymentProviderTile(
        title: 'India',
        badge: 'INR',
        subtitle: 'UPI, cards & net banking via Razorpay',
        selected: _paymentProvider == 'razorpay',
        onTap: () => setState(() => _paymentProvider = 'razorpay'),
      ),
      const SizedBox(height: AppSpacing.xs),
      _PaymentProviderTile(
        title: 'International',
        badge: 'USD',
        subtitle: 'PayPal — pay in USD from anywhere',
        selected: _paymentProvider == 'paypal',
        onTap: () => setState(() => _paymentProvider = 'paypal'),
      ),
      const SizedBox(height: AppSpacing.md),
      Text(
        _paymentProvider == 'paypal'
            ? 'International: pay \$${paypalUsd.toStringAsFixed(2)} USD via PayPal.'
            : 'India: pay in INR via UPI, card, or net banking.',
        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
      ),
    ];
  }
}

class _PaymentProviderTile extends StatelessWidget {
  const _PaymentProviderTile({
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
    this.badge,
  });

  final String title;
  final String subtitle;
  final String? badge;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? const Color(0xFF111827) : Colors.grey.shade300,
            ),
            color: selected ? const Color(0xFFF9FAFB) : Colors.white,
          ),
          child: Row(
            children: [
              Icon(
                selected ? Icons.radio_button_checked : Icons.radio_button_off,
                color: selected ? const Color(0xFF111827) : Colors.grey,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                        if (badge != null) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: badge == 'USD'
                                  ? const Color(0xFFDBEAFE)
                                  : const Color(0xFFD1FAE5),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              badge!,
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: badge == 'USD'
                                    ? const Color(0xFF1E40AF)
                                    : const Color(0xFF065F46),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    Text(subtitle, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
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
