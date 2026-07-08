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
  String _selectedCountryIso = 'IN';

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
        _applyPhonePrefill(auth.user!.phone);
      } else {
        final profile = await orders.getCheckoutProfile();
        if (profile != null) {
          _nameCtrl.text = profile.name;
          _emailCtrl.text = profile.email;
          _applyPhonePrefill(profile.phone);
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
        phone: '${_selectedCountry.dialCode} ${_phoneCtrl.text.trim()}'.trim(),
        purchaseReasons: _selectedReason == null ? [] : [_selectedReason!],
        purchaseReasonOther: _otherReasonCtrl.text,
      );

  void _applyPhonePrefill(String rawPhone) {
    final trimmed = rawPhone.trim();
    if (trimmed.isEmpty) {
      _phoneCtrl.clear();
      return;
    }

    final match = RegExp(r'^(\+\d{1,4})[\s-]*(.*)$').firstMatch(trimmed);
    if (match == null) {
      _phoneCtrl.text = trimmed;
      return;
    }

    final dialCode = match.group(1)!;
    final phoneNumber = match.group(2)?.trim() ?? '';
    final countryMatch = _countryOptions.cast<_CountryOption?>().firstWhere(
          (option) => option?.dialCode == dialCode,
          orElse: () => null,
        );
    if (countryMatch != null) {
      _selectedCountryIso = countryMatch.isoCode;
    }
    _phoneCtrl.text = phoneNumber;
  }

  _CountryOption get _selectedCountry {
    return _countryOptions.firstWhere(
      (option) => option.isoCode == _selectedCountryIso,
      orElse: () => _countryOptions.first,
    );
  }

  Future<void> _openCountryCodePicker() async {
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) {
        return SafeArea(
          child: ListView.separated(
            shrinkWrap: true,
            itemCount: _countryOptions.length,
            separatorBuilder: (_, __) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final option = _countryOptions[index];
              final selected = option.isoCode == _selectedCountryIso;
              return ListTile(
                leading: Text(option.flag, style: const TextStyle(fontSize: 18)),
                title: Text(option.label),
                trailing: selected
                    ? const Icon(Icons.check, color: Color(0xFF2563EB))
                    : null,
                onTap: () {
                  setState(() => _selectedCountryIso = option.isoCode);
                  Navigator.pop(ctx);
                },
              );
            },
          ),
        );
      },
    );
  }

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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        centerTitle: true,
        title: const Text('Checkout'),
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
                  child: Text(_error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12)),
                ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.xs, AppSpacing.lg, AppSpacing.lg),
                  children: [
                    if (_step == 0) ..._billingFields() else ..._summary(cartProvider),
                  ],
                ),
              ),
              if (_step == 1)
                _BottomBar(
                  processing: _processing,
                  step: _step,
                  total: cartProvider.cart.total,
                  onPrimary: _placeOrder,
                ),
            ],
          );
        },
      ),
    );
  }

  List<Widget> _billingFields() {
    final usageOptions = SiteContent.purchaseReasons.toList();

    return [
      Container(
        padding: const EdgeInsets.fromLTRB(14, 14, 14, 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE5E7EB)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x08000000),
              blurRadius: 10,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Billing Details',
              style: TextStyle(
                fontSize: 33 / 2,
                fontWeight: FontWeight.w700,
                color: Color(0xFF111827),
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'Download link will be sent to your email.',
              style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 14),
            const _FieldLabel(text: 'Full Name *'),
            const SizedBox(height: 7),
            _FramedInputField(
              controller: _nameCtrl,
              hintText: 'Full name',
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 12),
            const _FieldLabel(text: 'Email *'),
            const SizedBox(height: 7),
            _FramedInputField(
              controller: _emailCtrl,
              hintText: 'Email',
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 12),
            const _FieldLabel(text: 'Phone *'),
            const SizedBox(height: 7),
            Row(
              children: [
                InkWell(
                  onTap: _openCountryCodePicker,
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    width: 128,
                    height: 44,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFE5E7EB)),
                    ),
                    child: Row(
                      children: [
                        Text(_selectedCountry.flag, style: const TextStyle(fontSize: 16)),
                        const SizedBox(width: 8),
                        Text(
                          _selectedCountry.dialCode,
                          style: const TextStyle(fontSize: 16, color: Color(0xFF111827)),
                        ),
                        const Spacer(),
                        Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: Colors.grey.shade500),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _FramedInputField(
                    controller: _phoneCtrl,
                    hintText: 'Mobile number',
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.next,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            const _FieldLabel(text: 'Where will you use the video? *'),
            const SizedBox(height: 2),
            const Text(
              'Select one option',
              style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
            ),
            const SizedBox(height: 8),
            ...usageOptions.map(
              (reason) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _UsageOptionTile(
                  label: reason.$2,
                  selected: _selectedReason == reason.$1,
                  onTap: () => setState(() => _selectedReason = reason.$1),
                ),
              ),
            ),
            if (_selectedReason == 'other') ...[
              const SizedBox(height: 4),
              _FramedInputField(
                controller: _otherReasonCtrl,
                hintText: 'Describe your use',
                maxLines: 2,
              ),
            ],
            const SizedBox(height: 10),
            _AgreementTile(
              value: _acceptedTerms,
              onChanged: (v) => setState(() => _acceptedTerms = v),
              spans: [
                const TextSpan(text: 'I have read '),
                WidgetSpan(
                  alignment: PlaceholderAlignment.baseline,
                  baseline: TextBaseline.alphabetic,
                  child: GestureDetector(
                    onTap: () => context.push('/terms-and-conditions'),
                    child: const Text(
                      'Terms & Conditions',
                      style: TextStyle(
                        color: Color(0xFF1D4ED8),
                        decoration: TextDecoration.underline,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
                const TextSpan(text: ' and agree'),
              ],
            ),
            const SizedBox(height: 8),
            _AgreementTile(
              value: _acceptedLicensePolicy,
              onChanged: (v) => setState(() => _acceptedLicensePolicy = v),
              spans: [
                const TextSpan(text: 'I have read '),
                WidgetSpan(
                  alignment: PlaceholderAlignment.baseline,
                  baseline: TextBaseline.alphabetic,
                  child: GestureDetector(
                    onTap: () => context.push('/license-information-policy'),
                    child: const Text(
                      'License Information Policy',
                      style: TextStyle(
                        color: Color(0xFF1D4ED8),
                        decoration: TextDecoration.underline,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
                const TextSpan(text: ' and agree'),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 46,
              width: double.infinity,
              child: FilledButton(
                onPressed: _processing ? null : _continueToSummary,
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _processing
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        'Continue to Payment',
                        style: TextStyle(fontWeight: FontWeight.w700),
                      ),
              ),
            ),
          ],
        ),
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
          leading: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Container(
              width: 64,
              height: 64,
              color: const Color(0xFFF3F4F6),
              child: item.product?.thumbnailUrl.isNotEmpty == true
                  ? Image.network(
                      item.product!.thumbnailUrl,
                      fit: BoxFit.cover,
                      alignment: Alignment.topCenter,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.image_not_supported_outlined,
                        size: 18,
                        color: Color(0xFF9CA3AF),
                      ),
                    )
                  : const Icon(
                      Icons.image_outlined,
                      size: 18,
                      color: Color(0xFF9CA3AF),
                    ),
            ),
          ),
          title: Text(
            item.product?.name ?? 'Item',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 13),
          ),
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

class _CountryOption {
  const _CountryOption({
    required this.isoCode,
    required this.flag,
    required this.dialCode,
    required this.label,
  });

  final String isoCode;
  final String flag;
  final String dialCode;
  final String label;
}

const List<_CountryOption> _countryOptions = [
  _CountryOption(isoCode: 'IN', flag: '🇮🇳', dialCode: '+91', label: 'India (+91)'),
  _CountryOption(isoCode: 'US', flag: '🇺🇸', dialCode: '+1', label: 'United States (+1)'),
  _CountryOption(isoCode: 'AF', flag: '🇦🇫', dialCode: '+93', label: 'Afghanistan (+93)'),
  _CountryOption(isoCode: 'AL', flag: '🇦🇱', dialCode: '+355', label: 'Albania (+355)'),
  _CountryOption(isoCode: 'DZ', flag: '🇩🇿', dialCode: '+213', label: 'Algeria (+213)'),
  _CountryOption(isoCode: 'AS', flag: '🇦🇸', dialCode: '+1', label: 'American Samoa (+1)'),
  _CountryOption(isoCode: 'AD', flag: '🇦🇩', dialCode: '+376', label: 'Andorra (+376)'),
  _CountryOption(isoCode: 'AO', flag: '🇦🇴', dialCode: '+244', label: 'Angola (+244)'),
  _CountryOption(isoCode: 'AI', flag: '🇦🇮', dialCode: '+1', label: 'Anguilla (+1)'),
  _CountryOption(isoCode: 'AG', flag: '🇦🇬', dialCode: '+1', label: 'Antigua and Barbuda (+1)'),
  _CountryOption(isoCode: 'AR', flag: '🇦🇷', dialCode: '+54', label: 'Argentina (+54)'),
  _CountryOption(isoCode: 'AM', flag: '🇦🇲', dialCode: '+374', label: 'Armenia (+374)'),
  _CountryOption(isoCode: 'AW', flag: '🇦🇼', dialCode: '+297', label: 'Aruba (+297)'),
  _CountryOption(isoCode: 'GB', flag: '🇬🇧', dialCode: '+44', label: 'United Kingdom (+44)'),
  _CountryOption(isoCode: 'AE', flag: '🇦🇪', dialCode: '+971', label: 'United Arab Emirates (+971)'),
  _CountryOption(isoCode: 'SG', flag: '🇸🇬', dialCode: '+65', label: 'Singapore (+65)'),
  _CountryOption(isoCode: 'AU', flag: '🇦🇺', dialCode: '+61', label: 'Australia (+61)'),
  _CountryOption(isoCode: 'CA', flag: '🇨🇦', dialCode: '+1', label: 'Canada (+1)'),
  _CountryOption(isoCode: 'AT', flag: '🇦🇹', dialCode: '+43', label: 'Austria (+43)'),
  _CountryOption(isoCode: 'AZ', flag: '🇦🇿', dialCode: '+994', label: 'Azerbaijan (+994)'),
  _CountryOption(isoCode: 'BS', flag: '🇧🇸', dialCode: '+1', label: 'Bahamas (+1)'),
  _CountryOption(isoCode: 'BH', flag: '🇧🇭', dialCode: '+973', label: 'Bahrain (+973)'),
  _CountryOption(isoCode: 'BD', flag: '🇧🇩', dialCode: '+880', label: 'Bangladesh (+880)'),
  _CountryOption(isoCode: 'BB', flag: '🇧🇧', dialCode: '+1', label: 'Barbados (+1)'),
  _CountryOption(isoCode: 'BY', flag: '🇧🇾', dialCode: '+375', label: 'Belarus (+375)'),
  _CountryOption(isoCode: 'BE', flag: '🇧🇪', dialCode: '+32', label: 'Belgium (+32)'),
  _CountryOption(isoCode: 'BZ', flag: '🇧🇿', dialCode: '+501', label: 'Belize (+501)'),
  _CountryOption(isoCode: 'BJ', flag: '🇧🇯', dialCode: '+229', label: 'Benin (+229)'),
  _CountryOption(isoCode: 'BM', flag: '🇧🇲', dialCode: '+1', label: 'Bermuda (+1)'),
  _CountryOption(isoCode: 'BT', flag: '🇧🇹', dialCode: '+975', label: 'Bhutan (+975)'),
  _CountryOption(isoCode: 'BO', flag: '🇧🇴', dialCode: '+591', label: 'Bolivia (+591)'),
  _CountryOption(isoCode: 'BA', flag: '🇧🇦', dialCode: '+387', label: 'Bosnia and Herzegovina (+387)'),
  _CountryOption(isoCode: 'BW', flag: '🇧🇼', dialCode: '+267', label: 'Botswana (+267)'),
  _CountryOption(isoCode: 'BR', flag: '🇧🇷', dialCode: '+55', label: 'Brazil (+55)'),
  _CountryOption(isoCode: 'BN', flag: '🇧🇳', dialCode: '+673', label: 'Brunei (+673)'),
  _CountryOption(isoCode: 'BG', flag: '🇧🇬', dialCode: '+359', label: 'Bulgaria (+359)'),
  _CountryOption(isoCode: 'BF', flag: '🇧🇫', dialCode: '+226', label: 'Burkina Faso (+226)'),
  _CountryOption(isoCode: 'BI', flag: '🇧🇮', dialCode: '+257', label: 'Burundi (+257)'),
  _CountryOption(isoCode: 'KH', flag: '🇰🇭', dialCode: '+855', label: 'Cambodia (+855)'),
  _CountryOption(isoCode: 'CM', flag: '🇨🇲', dialCode: '+237', label: 'Cameroon (+237)'),
  _CountryOption(isoCode: 'CV', flag: '🇨🇻', dialCode: '+238', label: 'Cape Verde (+238)'),
  _CountryOption(isoCode: 'KY', flag: '🇰🇾', dialCode: '+1', label: 'Cayman Islands (+1)'),
  _CountryOption(isoCode: 'CF', flag: '🇨🇫', dialCode: '+236', label: 'Central African Republic (+236)'),
  _CountryOption(isoCode: 'TD', flag: '🇹🇩', dialCode: '+235', label: 'Chad (+235)'),
  _CountryOption(isoCode: 'CL', flag: '🇨🇱', dialCode: '+56', label: 'Chile (+56)'),
  _CountryOption(isoCode: 'CN', flag: '🇨🇳', dialCode: '+86', label: 'China (+86)'),
  _CountryOption(isoCode: 'CO', flag: '🇨🇴', dialCode: '+57', label: 'Colombia (+57)'),
  _CountryOption(isoCode: 'KM', flag: '🇰🇲', dialCode: '+269', label: 'Comoros (+269)'),
  _CountryOption(isoCode: 'CG', flag: '🇨🇬', dialCode: '+242', label: 'Congo (+242)'),
  _CountryOption(isoCode: 'CD', flag: '🇨🇩', dialCode: '+243', label: 'Congo (DRC) (+243)'),
  _CountryOption(isoCode: 'CK', flag: '🇨🇰', dialCode: '+682', label: 'Cook Islands (+682)'),
  _CountryOption(isoCode: 'CR', flag: '🇨🇷', dialCode: '+506', label: 'Costa Rica (+506)'),
  _CountryOption(isoCode: 'CI', flag: '🇨🇮', dialCode: '+225', label: 'Cote d\'Ivoire (+225)'),
  _CountryOption(isoCode: 'HR', flag: '🇭🇷', dialCode: '+385', label: 'Croatia (+385)'),
  _CountryOption(isoCode: 'CU', flag: '🇨🇺', dialCode: '+53', label: 'Cuba (+53)'),
  _CountryOption(isoCode: 'CY', flag: '🇨🇾', dialCode: '+357', label: 'Cyprus (+357)'),
  _CountryOption(isoCode: 'CZ', flag: '🇨🇿', dialCode: '+420', label: 'Czech Republic (+420)'),
  _CountryOption(isoCode: 'DK', flag: '🇩🇰', dialCode: '+45', label: 'Denmark (+45)'),
  _CountryOption(isoCode: 'DJ', flag: '🇩🇯', dialCode: '+253', label: 'Djibouti (+253)'),
  _CountryOption(isoCode: 'DM', flag: '🇩🇲', dialCode: '+1', label: 'Dominica (+1)'),
  _CountryOption(isoCode: 'DO', flag: '🇩🇴', dialCode: '+1', label: 'Dominican Republic (+1)'),
  _CountryOption(isoCode: 'EC', flag: '🇪🇨', dialCode: '+593', label: 'Ecuador (+593)'),
  _CountryOption(isoCode: 'EG', flag: '🇪🇬', dialCode: '+20', label: 'Egypt (+20)'),
  _CountryOption(isoCode: 'SV', flag: '🇸🇻', dialCode: '+503', label: 'El Salvador (+503)'),
  _CountryOption(isoCode: 'GQ', flag: '🇬🇶', dialCode: '+240', label: 'Equatorial Guinea (+240)'),
  _CountryOption(isoCode: 'ER', flag: '🇪🇷', dialCode: '+291', label: 'Eritrea (+291)'),
  _CountryOption(isoCode: 'EE', flag: '🇪🇪', dialCode: '+372', label: 'Estonia (+372)'),
  _CountryOption(isoCode: 'SZ', flag: '🇸🇿', dialCode: '+268', label: 'Eswatini (+268)'),
  _CountryOption(isoCode: 'ET', flag: '🇪🇹', dialCode: '+251', label: 'Ethiopia (+251)'),
  _CountryOption(isoCode: 'FJ', flag: '🇫🇯', dialCode: '+679', label: 'Fiji (+679)'),
  _CountryOption(isoCode: 'FI', flag: '🇫🇮', dialCode: '+358', label: 'Finland (+358)'),
  _CountryOption(isoCode: 'FR', flag: '🇫🇷', dialCode: '+33', label: 'France (+33)'),
  _CountryOption(isoCode: 'GF', flag: '🇬🇫', dialCode: '+594', label: 'French Guiana (+594)'),
  _CountryOption(isoCode: 'PF', flag: '🇵🇫', dialCode: '+689', label: 'French Polynesia (+689)'),
  _CountryOption(isoCode: 'GA', flag: '🇬🇦', dialCode: '+241', label: 'Gabon (+241)'),
  _CountryOption(isoCode: 'GM', flag: '🇬🇲', dialCode: '+220', label: 'Gambia (+220)'),
  _CountryOption(isoCode: 'GE', flag: '🇬🇪', dialCode: '+995', label: 'Georgia (+995)'),
  _CountryOption(isoCode: 'DE', flag: '🇩🇪', dialCode: '+49', label: 'Germany (+49)'),
  _CountryOption(isoCode: 'GH', flag: '🇬🇭', dialCode: '+233', label: 'Ghana (+233)'),
  _CountryOption(isoCode: 'GI', flag: '🇬🇮', dialCode: '+350', label: 'Gibraltar (+350)'),
  _CountryOption(isoCode: 'GR', flag: '🇬🇷', dialCode: '+30', label: 'Greece (+30)'),
  _CountryOption(isoCode: 'GL', flag: '🇬🇱', dialCode: '+299', label: 'Greenland (+299)'),
  _CountryOption(isoCode: 'GD', flag: '🇬🇩', dialCode: '+1', label: 'Grenada (+1)'),
  _CountryOption(isoCode: 'GP', flag: '🇬🇵', dialCode: '+590', label: 'Guadeloupe (+590)'),
  _CountryOption(isoCode: 'GU', flag: '🇬🇺', dialCode: '+1', label: 'Guam (+1)'),
  _CountryOption(isoCode: 'GT', flag: '🇬🇹', dialCode: '+502', label: 'Guatemala (+502)'),
  _CountryOption(isoCode: 'GN', flag: '🇬🇳', dialCode: '+224', label: 'Guinea (+224)'),
  _CountryOption(isoCode: 'GW', flag: '🇬🇼', dialCode: '+245', label: 'Guinea-Bissau (+245)'),
  _CountryOption(isoCode: 'GY', flag: '🇬🇾', dialCode: '+592', label: 'Guyana (+592)'),
  _CountryOption(isoCode: 'HT', flag: '🇭🇹', dialCode: '+509', label: 'Haiti (+509)'),
  _CountryOption(isoCode: 'HN', flag: '🇭🇳', dialCode: '+504', label: 'Honduras (+504)'),
  _CountryOption(isoCode: 'HK', flag: '🇭🇰', dialCode: '+852', label: 'Hong Kong (+852)'),
  _CountryOption(isoCode: 'HU', flag: '🇭🇺', dialCode: '+36', label: 'Hungary (+36)'),
  _CountryOption(isoCode: 'IS', flag: '🇮🇸', dialCode: '+354', label: 'Iceland (+354)'),
  _CountryOption(isoCode: 'ID', flag: '🇮🇩', dialCode: '+62', label: 'Indonesia (+62)'),
  _CountryOption(isoCode: 'IR', flag: '🇮🇷', dialCode: '+98', label: 'Iran (+98)'),
  _CountryOption(isoCode: 'IQ', flag: '🇮🇶', dialCode: '+964', label: 'Iraq (+964)'),
  _CountryOption(isoCode: 'IE', flag: '🇮🇪', dialCode: '+353', label: 'Ireland (+353)'),
  _CountryOption(isoCode: 'IL', flag: '🇮🇱', dialCode: '+972', label: 'Israel (+972)'),
  _CountryOption(isoCode: 'IT', flag: '🇮🇹', dialCode: '+39', label: 'Italy (+39)'),
  _CountryOption(isoCode: 'JM', flag: '🇯🇲', dialCode: '+1', label: 'Jamaica (+1)'),
  _CountryOption(isoCode: 'JP', flag: '🇯🇵', dialCode: '+81', label: 'Japan (+81)'),
  _CountryOption(isoCode: 'JO', flag: '🇯🇴', dialCode: '+962', label: 'Jordan (+962)'),
  _CountryOption(isoCode: 'KZ', flag: '🇰🇿', dialCode: '+7', label: 'Kazakhstan (+7)'),
  _CountryOption(isoCode: 'KE', flag: '🇰🇪', dialCode: '+254', label: 'Kenya (+254)'),
  _CountryOption(isoCode: 'KI', flag: '🇰🇮', dialCode: '+686', label: 'Kiribati (+686)'),
  _CountryOption(isoCode: 'KW', flag: '🇰🇼', dialCode: '+965', label: 'Kuwait (+965)'),
  _CountryOption(isoCode: 'KG', flag: '🇰🇬', dialCode: '+996', label: 'Kyrgyzstan (+996)'),
  _CountryOption(isoCode: 'LA', flag: '🇱🇦', dialCode: '+856', label: 'Laos (+856)'),
  _CountryOption(isoCode: 'LV', flag: '🇱🇻', dialCode: '+371', label: 'Latvia (+371)'),
  _CountryOption(isoCode: 'LB', flag: '🇱🇧', dialCode: '+961', label: 'Lebanon (+961)'),
  _CountryOption(isoCode: 'LS', flag: '🇱🇸', dialCode: '+266', label: 'Lesotho (+266)'),
  _CountryOption(isoCode: 'LR', flag: '🇱🇷', dialCode: '+231', label: 'Liberia (+231)'),
  _CountryOption(isoCode: 'LY', flag: '🇱🇾', dialCode: '+218', label: 'Libya (+218)'),
  _CountryOption(isoCode: 'LI', flag: '🇱🇮', dialCode: '+423', label: 'Liechtenstein (+423)'),
  _CountryOption(isoCode: 'LT', flag: '🇱🇹', dialCode: '+370', label: 'Lithuania (+370)'),
  _CountryOption(isoCode: 'LU', flag: '🇱🇺', dialCode: '+352', label: 'Luxembourg (+352)'),
  _CountryOption(isoCode: 'MO', flag: '🇲🇴', dialCode: '+853', label: 'Macau (+853)'),
  _CountryOption(isoCode: 'MG', flag: '🇲🇬', dialCode: '+261', label: 'Madagascar (+261)'),
  _CountryOption(isoCode: 'MW', flag: '🇲🇼', dialCode: '+265', label: 'Malawi (+265)'),
  _CountryOption(isoCode: 'MY', flag: '🇲🇾', dialCode: '+60', label: 'Malaysia (+60)'),
  _CountryOption(isoCode: 'MV', flag: '🇲🇻', dialCode: '+960', label: 'Maldives (+960)'),
  _CountryOption(isoCode: 'ML', flag: '🇲🇱', dialCode: '+223', label: 'Mali (+223)'),
  _CountryOption(isoCode: 'MT', flag: '🇲🇹', dialCode: '+356', label: 'Malta (+356)'),
  _CountryOption(isoCode: 'MH', flag: '🇲🇭', dialCode: '+692', label: 'Marshall Islands (+692)'),
  _CountryOption(isoCode: 'MQ', flag: '🇲🇶', dialCode: '+596', label: 'Martinique (+596)'),
  _CountryOption(isoCode: 'MR', flag: '🇲🇷', dialCode: '+222', label: 'Mauritania (+222)'),
  _CountryOption(isoCode: 'MU', flag: '🇲🇺', dialCode: '+230', label: 'Mauritius (+230)'),
  _CountryOption(isoCode: 'YT', flag: '🇾🇹', dialCode: '+262', label: 'Mayotte (+262)'),
  _CountryOption(isoCode: 'MX', flag: '🇲🇽', dialCode: '+52', label: 'Mexico (+52)'),
  _CountryOption(isoCode: 'FM', flag: '🇫🇲', dialCode: '+691', label: 'Micronesia (+691)'),
  _CountryOption(isoCode: 'MD', flag: '🇲🇩', dialCode: '+373', label: 'Moldova (+373)'),
  _CountryOption(isoCode: 'MC', flag: '🇲🇨', dialCode: '+377', label: 'Monaco (+377)'),
  _CountryOption(isoCode: 'MN', flag: '🇲🇳', dialCode: '+976', label: 'Mongolia (+976)'),
  _CountryOption(isoCode: 'ME', flag: '🇲🇪', dialCode: '+382', label: 'Montenegro (+382)'),
  _CountryOption(isoCode: 'MS', flag: '🇲🇸', dialCode: '+1', label: 'Montserrat (+1)'),
  _CountryOption(isoCode: 'MA', flag: '🇲🇦', dialCode: '+212', label: 'Morocco (+212)'),
  _CountryOption(isoCode: 'MZ', flag: '🇲🇿', dialCode: '+258', label: 'Mozambique (+258)'),
  _CountryOption(isoCode: 'MM', flag: '🇲🇲', dialCode: '+95', label: 'Myanmar (+95)'),
  _CountryOption(isoCode: 'NA', flag: '🇳🇦', dialCode: '+264', label: 'Namibia (+264)'),
  _CountryOption(isoCode: 'NR', flag: '🇳🇷', dialCode: '+674', label: 'Nauru (+674)'),
  _CountryOption(isoCode: 'NP', flag: '🇳🇵', dialCode: '+977', label: 'Nepal (+977)'),
  _CountryOption(isoCode: 'NL', flag: '🇳🇱', dialCode: '+31', label: 'Netherlands (+31)'),
  _CountryOption(isoCode: 'NC', flag: '🇳🇨', dialCode: '+687', label: 'New Caledonia (+687)'),
  _CountryOption(isoCode: 'NZ', flag: '🇳🇿', dialCode: '+64', label: 'New Zealand (+64)'),
  _CountryOption(isoCode: 'NI', flag: '🇳🇮', dialCode: '+505', label: 'Nicaragua (+505)'),
  _CountryOption(isoCode: 'NE', flag: '🇳🇪', dialCode: '+227', label: 'Niger (+227)'),
  _CountryOption(isoCode: 'NG', flag: '🇳🇬', dialCode: '+234', label: 'Nigeria (+234)'),
  _CountryOption(isoCode: 'NU', flag: '🇳🇺', dialCode: '+683', label: 'Niue (+683)'),
  _CountryOption(isoCode: 'KP', flag: '🇰🇵', dialCode: '+850', label: 'North Korea (+850)'),
  _CountryOption(isoCode: 'MK', flag: '🇲🇰', dialCode: '+389', label: 'North Macedonia (+389)'),
  _CountryOption(isoCode: 'NO', flag: '🇳🇴', dialCode: '+47', label: 'Norway (+47)'),
  _CountryOption(isoCode: 'OM', flag: '🇴🇲', dialCode: '+968', label: 'Oman (+968)'),
  _CountryOption(isoCode: 'PK', flag: '🇵🇰', dialCode: '+92', label: 'Pakistan (+92)'),
  _CountryOption(isoCode: 'PW', flag: '🇵🇼', dialCode: '+680', label: 'Palau (+680)'),
  _CountryOption(isoCode: 'PS', flag: '🇵🇸', dialCode: '+970', label: 'Palestine (+970)'),
  _CountryOption(isoCode: 'PA', flag: '🇵🇦', dialCode: '+507', label: 'Panama (+507)'),
  _CountryOption(isoCode: 'PG', flag: '🇵🇬', dialCode: '+675', label: 'Papua New Guinea (+675)'),
  _CountryOption(isoCode: 'PY', flag: '🇵🇾', dialCode: '+595', label: 'Paraguay (+595)'),
  _CountryOption(isoCode: 'PE', flag: '🇵🇪', dialCode: '+51', label: 'Peru (+51)'),
  _CountryOption(isoCode: 'PH', flag: '🇵🇭', dialCode: '+63', label: 'Philippines (+63)'),
  _CountryOption(isoCode: 'PL', flag: '🇵🇱', dialCode: '+48', label: 'Poland (+48)'),
  _CountryOption(isoCode: 'PT', flag: '🇵🇹', dialCode: '+351', label: 'Portugal (+351)'),
  _CountryOption(isoCode: 'PR', flag: '🇵🇷', dialCode: '+1', label: 'Puerto Rico (+1)'),
  _CountryOption(isoCode: 'QA', flag: '🇶🇦', dialCode: '+974', label: 'Qatar (+974)'),
  _CountryOption(isoCode: 'RE', flag: '🇷🇪', dialCode: '+262', label: 'Reunion (+262)'),
  _CountryOption(isoCode: 'RO', flag: '🇷🇴', dialCode: '+40', label: 'Romania (+40)'),
  _CountryOption(isoCode: 'RU', flag: '🇷🇺', dialCode: '+7', label: 'Russia (+7)'),
  _CountryOption(isoCode: 'RW', flag: '🇷🇼', dialCode: '+250', label: 'Rwanda (+250)'),
  _CountryOption(isoCode: 'KN', flag: '🇰🇳', dialCode: '+1', label: 'Saint Kitts and Nevis (+1)'),
  _CountryOption(isoCode: 'LC', flag: '🇱🇨', dialCode: '+1', label: 'Saint Lucia (+1)'),
  _CountryOption(isoCode: 'VC', flag: '🇻🇨', dialCode: '+1', label: 'Saint Vincent and the Grenadines (+1)'),
  _CountryOption(isoCode: 'WS', flag: '🇼🇸', dialCode: '+685', label: 'Samoa (+685)'),
  _CountryOption(isoCode: 'SM', flag: '🇸🇲', dialCode: '+378', label: 'San Marino (+378)'),
  _CountryOption(isoCode: 'ST', flag: '🇸🇹', dialCode: '+239', label: 'Sao Tome and Principe (+239)'),
  _CountryOption(isoCode: 'SA', flag: '🇸🇦', dialCode: '+966', label: 'Saudi Arabia (+966)'),
  _CountryOption(isoCode: 'SN', flag: '🇸🇳', dialCode: '+221', label: 'Senegal (+221)'),
  _CountryOption(isoCode: 'RS', flag: '🇷🇸', dialCode: '+381', label: 'Serbia (+381)'),
  _CountryOption(isoCode: 'SC', flag: '🇸🇨', dialCode: '+248', label: 'Seychelles (+248)'),
  _CountryOption(isoCode: 'SL', flag: '🇸🇱', dialCode: '+232', label: 'Sierra Leone (+232)'),
  _CountryOption(isoCode: 'SK', flag: '🇸🇰', dialCode: '+421', label: 'Slovakia (+421)'),
  _CountryOption(isoCode: 'SI', flag: '🇸🇮', dialCode: '+386', label: 'Slovenia (+386)'),
  _CountryOption(isoCode: 'SB', flag: '🇸🇧', dialCode: '+677', label: 'Solomon Islands (+677)'),
  _CountryOption(isoCode: 'SO', flag: '🇸🇴', dialCode: '+252', label: 'Somalia (+252)'),
  _CountryOption(isoCode: 'ZA', flag: '🇿🇦', dialCode: '+27', label: 'South Africa (+27)'),
  _CountryOption(isoCode: 'KR', flag: '🇰🇷', dialCode: '+82', label: 'South Korea (+82)'),
  _CountryOption(isoCode: 'SS', flag: '🇸🇸', dialCode: '+211', label: 'South Sudan (+211)'),
  _CountryOption(isoCode: 'ES', flag: '🇪🇸', dialCode: '+34', label: 'Spain (+34)'),
  _CountryOption(isoCode: 'LK', flag: '🇱🇰', dialCode: '+94', label: 'Sri Lanka (+94)'),
  _CountryOption(isoCode: 'SD', flag: '🇸🇩', dialCode: '+249', label: 'Sudan (+249)'),
  _CountryOption(isoCode: 'SR', flag: '🇸🇷', dialCode: '+597', label: 'Suriname (+597)'),
  _CountryOption(isoCode: 'SE', flag: '🇸🇪', dialCode: '+46', label: 'Sweden (+46)'),
  _CountryOption(isoCode: 'CH', flag: '🇨🇭', dialCode: '+41', label: 'Switzerland (+41)'),
  _CountryOption(isoCode: 'SY', flag: '🇸🇾', dialCode: '+963', label: 'Syria (+963)'),
  _CountryOption(isoCode: 'TW', flag: '🇹🇼', dialCode: '+886', label: 'Taiwan (+886)'),
  _CountryOption(isoCode: 'TJ', flag: '🇹🇯', dialCode: '+992', label: 'Tajikistan (+992)'),
  _CountryOption(isoCode: 'TZ', flag: '🇹🇿', dialCode: '+255', label: 'Tanzania (+255)'),
  _CountryOption(isoCode: 'TH', flag: '🇹🇭', dialCode: '+66', label: 'Thailand (+66)'),
  _CountryOption(isoCode: 'TL', flag: '🇹🇱', dialCode: '+670', label: 'Timor-Leste (+670)'),
  _CountryOption(isoCode: 'TG', flag: '🇹🇬', dialCode: '+228', label: 'Togo (+228)'),
  _CountryOption(isoCode: 'TO', flag: '🇹🇴', dialCode: '+676', label: 'Tonga (+676)'),
  _CountryOption(isoCode: 'TT', flag: '🇹🇹', dialCode: '+1', label: 'Trinidad and Tobago (+1)'),
  _CountryOption(isoCode: 'TN', flag: '🇹🇳', dialCode: '+216', label: 'Tunisia (+216)'),
  _CountryOption(isoCode: 'TR', flag: '🇹🇷', dialCode: '+90', label: 'Turkey (+90)'),
  _CountryOption(isoCode: 'TM', flag: '🇹🇲', dialCode: '+993', label: 'Turkmenistan (+993)'),
  _CountryOption(isoCode: 'TC', flag: '🇹🇨', dialCode: '+1', label: 'Turks and Caicos Islands (+1)'),
  _CountryOption(isoCode: 'TV', flag: '🇹🇻', dialCode: '+688', label: 'Tuvalu (+688)'),
  _CountryOption(isoCode: 'UG', flag: '🇺🇬', dialCode: '+256', label: 'Uganda (+256)'),
  _CountryOption(isoCode: 'UA', flag: '🇺🇦', dialCode: '+380', label: 'Ukraine (+380)'),
  _CountryOption(isoCode: 'UY', flag: '🇺🇾', dialCode: '+598', label: 'Uruguay (+598)'),
  _CountryOption(isoCode: 'UZ', flag: '🇺🇿', dialCode: '+998', label: 'Uzbekistan (+998)'),
  _CountryOption(isoCode: 'VU', flag: '🇻🇺', dialCode: '+678', label: 'Vanuatu (+678)'),
  _CountryOption(isoCode: 'VA', flag: '🇻🇦', dialCode: '+379', label: 'Vatican City (+379)'),
  _CountryOption(isoCode: 'VE', flag: '🇻🇪', dialCode: '+58', label: 'Venezuela (+58)'),
  _CountryOption(isoCode: 'VN', flag: '🇻🇳', dialCode: '+84', label: 'Vietnam (+84)'),
  _CountryOption(isoCode: 'VG', flag: '🇻🇬', dialCode: '+1', label: 'British Virgin Islands (+1)'),
  _CountryOption(isoCode: 'VI', flag: '🇻🇮', dialCode: '+1', label: 'US Virgin Islands (+1)'),
  _CountryOption(isoCode: 'YE', flag: '🇾🇪', dialCode: '+967', label: 'Yemen (+967)'),
  _CountryOption(isoCode: 'ZM', flag: '🇿🇲', dialCode: '+260', label: 'Zambia (+260)'),
  _CountryOption(isoCode: 'ZW', flag: '🇿🇼', dialCode: '+263', label: 'Zimbabwe (+263)'),
];

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
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.md),
      child: Column(
        children: [
          Row(
            children: [
              _StepCircle(number: 1, active: step == 0, done: step > 0),
              Expanded(
                child: Container(
                  height: 2,
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  color: step > 0 ? const Color(0xFF2563EB) : const Color(0xFFD1D5DB),
                ),
              ),
              _StepCircle(number: 2, active: step == 1, done: false),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Expanded(
                child: Text(
                  'Billing',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF2563EB)),
                ),
              ),
              Expanded(
                child: Text(
                  'Payment',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: step == 1 ? const Color(0xFF2563EB) : const Color(0xFF9CA3AF),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StepCircle extends StatelessWidget {
  const _StepCircle({required this.number, required this.active, required this.done});

  final int number;
  final bool active;
  final bool done;

  @override
  Widget build(BuildContext context) {
    final isActive = active || done;
    return CircleAvatar(
      radius: 14,
      backgroundColor: isActive ? const Color(0xFF2563EB) : const Color(0xFFE5E7EB),
      child: done
          ? const Icon(Icons.check, size: 14, color: Colors.white)
          : Text(
              '$number',
              style: TextStyle(
                color: isActive ? Colors.white : const Color(0xFF9CA3AF),
                fontSize: 13,
                fontWeight: FontWeight.w700,
              ),
            ),
    );
  }
}

class _FieldLabel extends StatelessWidget {
  const _FieldLabel({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: Color(0xFF111827),
      ),
    );
  }
}

class _FramedInputField extends StatelessWidget {
  const _FramedInputField({
    required this.controller,
    required this.hintText,
    this.keyboardType,
    this.textInputAction,
    this.maxLines = 1,
  });

  final TextEditingController controller;
  final String hintText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final int maxLines;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      maxLines: maxLines,
      decoration: InputDecoration(
        hintText: hintText,
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFF93C5FD)),
        ),
      ),
    );
  }
}

class _UsageOptionTile extends StatelessWidget {
  const _UsageOptionTile({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: selected ? const Color(0xFF93C5FD) : const Color(0xFFE5E7EB),
          ),
        ),
        child: Row(
          children: [
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_off,
              size: 20,
              color: selected ? const Color(0xFF2563EB) : const Color(0xFF9CA3AF),
            ),
            const SizedBox(width: 10),
            Text(
              label,
              style: const TextStyle(
                fontSize: 15,
                color: Color(0xFF111827),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AgreementTile extends StatelessWidget {
  const _AgreementTile({
    required this.value,
    required this.onChanged,
    required this.spans,
  });

  final bool value;
  final ValueChanged<bool> onChanged;
  final List<InlineSpan> spans;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!value),
      borderRadius: BorderRadius.circular(10),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 2),
        child: Row(
          children: [
            Checkbox(
              value: value,
              onChanged: (v) => onChanged(v ?? false),
              visualDensity: VisualDensity.compact,
            ),
            const SizedBox(width: 4),
            Expanded(
              child: RichText(
                text: TextSpan(
                  style: const TextStyle(fontSize: 12, color: Color(0xFF374151)),
                  children: spans,
                ),
              ),
            ),
          ],
        ),
      ),
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
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
              ),
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
