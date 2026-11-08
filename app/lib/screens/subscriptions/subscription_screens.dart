import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:printing/printing.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../../services/subscription_service.dart';
import '../../services/razorpay_checkout.dart';
import '../../services/paypal_checkout.dart';
import '../../core/utils/phone_utils.dart';
import '../../widgets/auth/phone_country_field.dart';
import '../account/login_screen.dart';

num _number(dynamic value) => num.tryParse('$value') ?? 0;
String _money(dynamic value) => NumberFormat.currency(
  locale: 'en_IN',
  symbol: '₹',
  decimalDigits: 0,
).format(_number(value));
String _date(dynamic value) {
  final date = DateTime.tryParse('$value');
  return date == null ? '—' : DateFormat.yMMMd().format(date.toLocal());
}

List<Map<String, dynamic>> _maps(dynamic value) => (value as List? ?? [])
    .whereType<Map>()
    .map((p) => Map<String, dynamic>.from(p))
    .toList();
Future<SubscriptionService> _service() async =>
    SubscriptionService(await ApiClient.create());

class SubscriptionsScreen extends StatefulWidget {
  const SubscriptionsScreen({super.key});
  @override
  State<SubscriptionsScreen> createState() => _SubscriptionsScreenState();
}

class _SubscriptionsScreenState extends State<SubscriptionsScreen> {
  late Future<Map<String, dynamic>> _plans;
  String _interval = 'monthly';
  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() {
    _plans = _service().then((s) => s.plans());
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Text('Subscriptions'),
      actions: [
        TextButton(
          onPressed: () => context.push('/my-subscription'),
          child: const Text('My subscription'),
        ),
      ],
    ),
    body: _AsyncContent(
      future: _plans,
      retry: () => setState(_reload),
      builder: (data) {
        final plans = _maps(data['plans']);
        final filtered = plans
            .where(
              (p) => (_interval == 'weekly'
                  ? ['weekly', 'days', 'custom'].contains(p['interval'])
                  : p['interval'] == _interval),
            )
            .toList();
        return RefreshIndicator(
          onRefresh: () async {
            setState(_reload);
            await _plans;
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 8,
                children: ['weekly', 'monthly', 'yearly']
                    .map(
                      (v) => ChoiceChip(
                        label: Text(v[0].toUpperCase() + v.substring(1)),
                        selected: v == _interval,
                        showCheckmark: false,
                        visualDensity: VisualDensity.compact,
                        padding: EdgeInsets.zero,
                        labelPadding: const EdgeInsets.symmetric(
                          horizontal: 10,
                        ),
                        labelStyle: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: v == _interval
                              ? Colors.white
                              : const Color(0xFF153E75),
                        ),
                        backgroundColor: Colors.transparent,
                        selectedColor: const Color(0xFF153E75),
                        checkmarkColor: Colors.white,
                        shape: const StadiumBorder(),
                        side: BorderSide(
                          color: const Color(0xFF153E75),
                          width: v == _interval ? 2 : 1,
                        ),
                        onSelected: (_) => setState(() => _interval = v),
                      ),
                    )
                    .toList(),
              ),
              if (filtered.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('No plans available for this billing interval.'),
                ),
              for (final plan in filtered)
                _Panel(
                  badge: plan['badge']?.toString(),
                    compact: true,
                  accentColor: plan['interval'] == 'yearly'
                      ? const Color(0xFFD4AF37)
                      : const Color(0xFF153E75),
                  children: [
                    _PlanSummary(plan: plan),
                    const Divider(height: 16, color: Color(0xFFE9EDF2)),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Includes ${plan['videoQuota']} Website Video Downloads',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Download up to ${plan['videoQuota']} full-resolution editorial videos directly from the website.',
                          style: const TextStyle(
                            color: Color(0xFF778194),
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 16, color: Color(0xFFE9EDF2)),
                    for (final feature in plan['features'] as List? ?? [])
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: const Color(0xFFD8E8FF),
                              ),
                            ),
                            child: const Icon(
                              Icons.check,
                              size: 14,
                              color: Color(0xFF2563EB),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              '$feature',
                              style: const TextStyle(
                                color: Color(0xFF475569),
                                height: 1.6,
                              ),
                            ),
                          ),
                        ],
                      ),
                    FilledButton(
                      onPressed: () => context.push(
                        '/subscriptions/checkout?planId=${Uri.encodeQueryComponent('${plan['_id']}')}',
                      ),
                      child: const Text('Select plan'),
                    ),
                  ],
                ),
              TextButton(
                onPressed: () => context.push('/subscription-policy'),
                child: const Text(
                  'Subscription terms & editorial usage policy',
                ),
              ),
            ],
          ),
        );
      },
    ),
  );
}

class _SubscriptionAmountRow extends StatelessWidget {
  const _SubscriptionAmountRow({required this.label, required this.amount, this.emphasis = false});
  final String label;
  final String amount;
  final bool emphasis;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Expanded(child: Text(label, style: TextStyle(
        fontWeight: emphasis ? FontWeight.bold : FontWeight.normal,
        color: emphasis ? const Color(0xFF111827) : const Color(0xFF778194),
      ))),
      const SizedBox(width: 12),
      Flexible(child: Text(amount, textAlign: TextAlign.right, style: TextStyle(
        fontWeight: emphasis ? FontWeight.w800 : FontWeight.w600,
        fontSize: emphasis ? 18 : 14,
      ))),
    ],
  );
}

class _PlanSummary extends StatelessWidget {
  const _PlanSummary({required this.plan, this.formatPrice});
  final Map<String, dynamic> plan;
  final String Function(num)? formatPrice;

  @override
  Widget build(BuildContext context) {
    String money(num amount) => formatPrice?.call(amount) ?? _money(amount);
    final original = _number(plan['originalPrice']);
    final price = _number(plan['price']);
    final interval = switch (plan['interval']) {
      'weekly' => 'Week',
      'monthly' => 'Month',
      'yearly' => 'Year',
      _ => '${plan['durationDays'] ?? 30} Days',
    };
    final title = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${plan['name']}',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w800,
            color: const Color(0xFF111827),
            height: 1.25,
          ),
        ),
        if ('${plan['tagline'] ?? ''}'.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(
            '${plan['tagline']}',
            style: const TextStyle(color: Color(0xFF778194), height: 1.5),
          ),
        ],
      ],
    );
    final pricing = Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        if (original > 0 && original > price)
          Wrap(
            alignment: WrapAlignment.end,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 6,
            runSpacing: 4,
            children: [
              Text(
                money(original),
                style: const TextStyle(
                  color: Color(0xFF9AA3B2),
                  decoration: TextDecoration.lineThrough,
                  fontSize: 12,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Text(
                  '${((original - price) / original * 100).round()}% OFF',
                  style: const TextStyle(
                    color: Color(0xFF15803D),
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
        const SizedBox(height: 4),
        FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerRight,
          child: Text(
            money(price),
            style: const TextStyle(
              fontSize: 30,
              fontWeight: FontWeight.w900,
              color: Color(0xFF111827),
              height: 1.2,
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          '/ $interval',
          style: const TextStyle(
            color: Color(0xFF778194),
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth < 280 ||
            MediaQuery.textScalerOf(context).scale(14) > 20) {
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [title, const SizedBox(height: 16), pricing],
          );
        }
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(flex: 6, child: title),
            const SizedBox(width: 16),
            Expanded(flex: 5, child: pricing),
          ],
        );
      },
    );
  }
}

class SubscriptionCheckoutScreen extends StatefulWidget {
  const SubscriptionCheckoutScreen({super.key, required this.planId});
  final String planId;
  @override
  State<SubscriptionCheckoutScreen> createState() =>
      _SubscriptionCheckoutScreenState();
}

class _SubscriptionCheckoutScreenState
    extends State<SubscriptionCheckoutScreen> {
  late Future<Map<String, dynamic>> _plans;
  final _form = GlobalKey<FormState>();
  late final TapGestureRecognizer _policyLink;
  late final TapGestureRecognizer _termsLink;
  late final TapGestureRecognizer _privacyLink;
  final _phone = TextEditingController();
  final _phoneKey = GlobalKey<PhoneCountryFieldState>();
  String get _internationalPhone =>
      _phoneKey.currentState?.internationalPhone ?? '';
  final _razorpay = RazorpayCheckout();
  final _paypal = PayPalCheckout();
  String _provider = 'razorpay';
  bool _policy = false, _terms = false, _busy = false;
  String? _error, _pendingId;
  Map<String, dynamic>? _pendingVerification;
  @override
  void initState() {
    super.initState();
    _plans = _service().then((s) => s.plans());
    _policyLink = TapGestureRecognizer()
      ..onTap = () => context.push('/subscription-policy');
    _termsLink = TapGestureRecognizer()
      ..onTap = () => context.push('/terms-and-conditions');
    _privacyLink = TapGestureRecognizer()
      ..onTap = () => context.push('/privacy-policy');
    final savedPhone = normalizePhoneValue(
      context.read<AuthProvider>().user?.phone ?? '',
    ).replaceAll(RegExp(r'[^+0-9]'), '');
    if (savedPhone.startsWith('+91')) {
      _phone.text = savedPhone.substring(3);
    }
  }

  @override
  void dispose() {
    _policyLink.dispose();
    _termsLink.dispose();
    _privacyLink.dispose();
    _phone.dispose();
    _razorpay.dispose();
    super.dispose();
  }

  Future<void> _pay(Map<String, dynamic> plan) async {
    if (_busy) return;
    if (_pendingId == null &&
        (!_form.currentState!.validate() || !_policy || !_terms)) {
      setState(
        () => _error =
            'Enter a valid WhatsApp number and accept both policy agreements.',
      );
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final service = await _service();
      Map<String, dynamic> result;
      if (_pendingId != null) {
        result = _pendingVerification == null
            ? await service.verifyPayPal(_pendingId!)
            : await service.verify(_pendingVerification!);
      } else {
        final overview = await service.mine();
        final current = overview['subscription'] as Map?;
        final activePlans = _maps(current?['plans']);
        final alreadyActive =
            overview['hasActiveSubscription'] == true &&
            (activePlans.any(
                  (p) =>
                      p['planId'] == plan['_id'] || p['name'] == plan['name'],
                ) ||
                current?['planName'] == plan['name']);
        if (alreadyActive) {
          if (mounted) context.go('/my-subscription');
          return;
        }
        final checkout = await service.checkout(
          '${plan['_id']}',
          _provider,
          _internationalPhone,
        );
        if (checkout['directActive'] == true) {
          result = checkout;
        } else {
          final id = checkout['subscriptionId']?.toString() ?? '';
          if (id.isEmpty) throw Exception('Missing subscription reference.');
          if (_provider == 'paypal') {
            final paypal = checkout['paypal'] as Map?;
            final approval = Uri.tryParse('${paypal?['approvalUrl']}');
            if (approval == null ||
                approval.scheme != 'https' ||
                !(approval.host == 'www.paypal.com' ||
                    approval.host == 'www.sandbox.paypal.com')) {
              throw Exception('PayPal checkout is unavailable.');
            }
            if (!mounted) return;
            await _paypal.open(
              context: context,
              approvalUrl: approval.toString(),
              subscriptionId: id,
            );
            _pendingId = id;
            result = await service.verifyPayPal(id);
          } else {
            final gateway = checkout['razorpay'] as Map?;
            final remoteId = gateway?['subscriptionId']?.toString() ?? '';
            final key = gateway?['keyId']?.toString() ?? '';
            if (remoteId.isEmpty || key.isEmpty) {
              throw Exception('Recurring payment gateway is unavailable.');
            }
            if (!mounted) return;
            final user = context.read<AuthProvider>().user!;
            final payment = await _razorpay.open(
              keyId: key,
              amount: 0,
              currency: 'INR',
              razorpaySubscriptionId: remoteId,
              name: 'AKHD Media & Co.',
              description: '${plan['name']} (${plan['interval']})',
              customerName: user.name,
              customerEmail: user.email,
              customerPhone: _internationalPhone,
            );
            _pendingId = id;
            _pendingVerification = {
              'subscriptionId': id,
              'razorpay_subscription_id': payment.razorpaySubscriptionId,
              'razorpay_payment_id': payment.razorpayPaymentId,
              'razorpay_signature': payment.razorpaySignature,
            };
            result = await service.verify(_pendingVerification!);
          }
        }
      }
      if (!mounted) return;
      final sub = result['subscription'] as Map?;
      if (sub?['status'] != 'active') {
        throw Exception(
          'Payment is still processing. Retry verification shortly.',
        );
      }
      context.go('/subscriptions/success');
    } catch (e) {
      if (mounted) setState(() => _error = ApiClient.unwrapError(e).toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (auth.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (!auth.isAuthenticated) {
      return LoginScreen(
        redirectTo: '/subscriptions/checkout?planId=${widget.planId}',
      );
    }
    return PopScope(
      canPop: !_busy,
      child: Scaffold(
        appBar: AppBar(title: const Text('Confirm subscription')),
        body: _AsyncContent(
          future: _plans,
          retry: () =>
              setState(() => _plans = _service().then((s) => s.plans())),
          builder: (data) {
            final matches = _maps(
              data['plans'],
            ).where((p) => p['_id'] == widget.planId);
            if (matches.isEmpty) {
              return Center(
                child: TextButton(
                  onPressed: () => context.go('/subscriptions'),
                  child: const Text('Plan unavailable. View all plans'),
                ),
              );
            }
            final plan = matches.first;
            final subtotal = _number(plan['price']);
            final gstRate = _number(plan['gstPercentage'] ?? 18);
            final gst = (subtotal * gstRate / 100).round();
            final total = subtotal + gst;
            final rate = _number(data['usdInrRate']);
            final paypalEnabled =
                (data['providers'] as Map?)?['paypal'] == true && rate > 0;
            String price(num amount) => _provider == 'paypal' && rate > 0
                ? '${NumberFormat.simpleCurrency(name: 'USD').format(amount / rate)} USD'
                : _money(amount);
            return Form(
              key: _form,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _Panel(
                    children: [
                      Row(
                        children: [
                          SvgPicture.asset('assets/payment/whatsapp.svg', width: 36, height: 36, semanticsLabel: 'WhatsApp'),
                          const SizedBox(width: 10),
                          Expanded(child: Text('WhatsApp video delivery', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold))),
                        ],
                      ),
                      const Text(
                        'A dedicated WhatsApp group will be created within 6 hours of successful payment confirmation for daily editorial video delivery.',
                      ),
                      PhoneCountryField(
                        key: _phoneKey,
                        controller: _phone,
                        label: 'WhatsApp mobile number',
                        initialCountryCode: 'IN',
                        enabled: !_busy && _pendingId == null,
                        validator: (value) => isPhoneNumberValid(value ?? '')
                            ? null
                            : 'Enter a valid mobile number',
                      ),
                      const Divider(height: 24),
                      Text(
                        'Terms & Policy Agreement',
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'Please review and accept our subscription and usage policies before proceeding to payment.',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                          height: 1.5,
                        ),
                      ),
                      _AgreementRow(
                        value: _policy,
                        onChanged: _busy
                            ? null
                            : (value) => setState(() => _policy = value!),
                        label:
                            'Agree to subscription terms and editorial content usage policy',
                        spans: [
                          const TextSpan(text: 'I have read and agree to the '),
                          TextSpan(
                            text:
                                'Subscription Terms & Editorial Content Usage Policy',
                            style: _agreementLinkStyle,
                            recognizer: _policyLink,
                          ),
                        ],
                      ),
                      _AgreementRow(
                        value: _terms,
                        onChanged: _busy
                            ? null
                            : (value) => setState(() => _terms = value!),
                        label:
                            'Agree to terms and conditions and privacy policy',
                        spans: [
                          const TextSpan(text: 'I have read and agree to the '),
                          TextSpan(
                            text: 'Terms and Conditions',
                            style: _agreementLinkStyle,
                            recognizer: _termsLink,
                          ),
                          const TextSpan(text: ' and '),
                          TextSpan(
                            text: 'Privacy Policy',
                            style: _agreementLinkStyle,
                            recognizer: _privacyLink,
                          ),
                        ],
                      ),
                    ],
                  ),
                  _Panel(
                    badge: plan['badge']?.toString(),
                    compact: true,
                    accentColor: plan['interval'] == 'yearly'
                        ? const Color(0xFFD4AF37)
                        : const Color(0xFF153E75),
                    children: [
                      _PlanSummary(plan: plan, formatPrice: price),
                      const Divider(height: 16, color: Color(0xFFE9EDF2)),
                      Text(
                        'Includes ${plan['videoQuota']} Website Video Downloads',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      const Text('4K-UHD RAW Masters', style: TextStyle(color: Color(0xFF778194))),
                      const Divider(height: 16, color: Color(0xFFE9EDF2)),
                      _SubscriptionAmountRow(label: 'Subtotal', amount: price(subtotal)),
                      _SubscriptionAmountRow(label: 'GST ($gstRate%)', amount: price(gst)),
                      const Divider(height: 16, color: Color(0xFFE9EDF2)),
                      _SubscriptionAmountRow(label: 'Total payable', amount: price(total), emphasis: true),
                    ],
                  ),
                  if (subtotal > 0)
                    _Panel(
                      children: [
                        Text(
                          'Payment method',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            for (final provider in ['razorpay', if (paypalEnabled) 'paypal'])
                              Expanded(
                                child: Padding(
                                  padding: EdgeInsets.only(right: provider == 'razorpay' && paypalEnabled ? 10 : 0),
                                  child: Semantics(
                                    checked: _provider == provider,
                                    inMutuallyExclusiveGroup: true,
                                    button: true,
                                    child: Material(
                                      color: _provider == provider ? const Color(0xFFEFF6FF) : Colors.white,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        side: BorderSide(color: _provider == provider ? const Color(0xFF153E75) : const Color(0xFFCBD5E1)),
                                      ),
                                      child: InkWell(
                                        borderRadius: BorderRadius.circular(12),
                                        onTap: _busy || _pendingId != null ? null : () => setState(() => _provider = provider),
                                        child: Padding(
                                          padding: const EdgeInsets.all(10),
                                          child: Column(
                                            children: [
                                              Align(
                                                alignment: Alignment.centerLeft,
                                                child: Icon(_provider == provider ? Icons.radio_button_checked : Icons.radio_button_off, size: 18, color: const Color(0xFF153E75)),
                                              ),
                                              SizedBox(
                                                height: 48,
                                                child: Center(
                                                  child: provider == 'paypal'
                                                      ? Image.asset('assets/payment/paypal.jpg', width: 76, height: 48, fit: BoxFit.contain, semanticLabel: 'PayPal')
                                                      : SvgPicture.asset('assets/payment/razorpay.svg', width: 100, height: 24, fit: BoxFit.contain, semanticsLabel: 'Razorpay'),
                                                ),
                                              ),
                                              const SizedBox(height: 6),
                                              Text(provider == 'paypal' ? 'International (USD)' : 'India', textAlign: TextAlign.center, style: const TextStyle(fontSize: 12)),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const Text(
                          'AutoPay: your subscription renews automatically each billing cycle until you cancel in My subscription.',
                        ),
                        if (_provider == 'paypal')
                          const Text(
                            'Prices are converted to USD. Approve automatic renewal on PayPal to complete setup.',
                          ),
                      ],
                    ),
                  if (_error != null)
                    Padding(
                      padding: const EdgeInsets.all(8),
                      child: Text(
                        _error!,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ),
                  FilledButton(
                    onPressed: _busy ? null : () => _pay(plan),
                    child: Text(
                      _busy
                          ? 'Processing…'
                          : _pendingId != null
                          ? 'Retry payment verification'
                          : subtotal == 0
                          ? 'Activate subscription'
                          : 'Proceed to payment · ${price(total)}',
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class MySubscriptionScreen extends StatefulWidget {
  const MySubscriptionScreen({super.key});
  @override
  State<MySubscriptionScreen> createState() => _MySubscriptionScreenState();
}

class _MySubscriptionScreenState extends State<MySubscriptionScreen> {
  Future<Map<String, dynamic>>? _future;
  bool _busy = false;
  String? _error;
  void _reload() {
    _future = _service().then((s) => s.mine());
  }

  Future<void> _cancel(Map<String, dynamic> plan) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Cancel AutoPay?'),
        content: Text(
          'Stop renewal for ${plan['name'] ?? plan['planName']}? Your remaining ${plan['videoQuotaRemaining']} downloads and access stay available until ${_date(plan['endDate'])}.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, false),
            child: const Text('Keep subscription'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Cancel AutoPay'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    await _action(() async {
      await (await _service()).cancel('${plan['id']}');
      if (mounted) setState(_reload);
    });
  }

  Future<void> _action(Future<void> Function() run) async {
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await run();
    } catch (e) {
      if (mounted) setState(() => _error = ApiClient.unwrapError(e).toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (auth.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (!auth.isAuthenticated) {
      _future = null;
      return const LoginScreen(redirectTo: '/my-subscription');
    }
    if (_future == null) _reload();
    return Scaffold(
      appBar: AppBar(title: const Text('My subscription')),
      body: _AsyncContent(
        future: _future!,
        retry: () => setState(_reload),
        builder: (data) {
          final sub = data['subscription'] as Map?;
          final plans = _maps(sub?['plans']);
          if (sub != null && plans.isEmpty) {
            plans.add(Map<String, dynamic>.from(sub));
          }
          return RefreshIndicator(
            onRefresh: () async {
              setState(_reload);
              await _future;
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                if (_error != null)
                  Text(
                    _error!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                if (plans.isEmpty)
                  const _Panel(
                    children: [
                      Text(
                        'No subscription yet. Choose a plan to get started.',
                      ),
                    ],
                  ),
                for (final plan in plans)
                  _Panel(
                    children: [
                      Text(
                        '${plan['name'] ?? plan['planName']}',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text('Status: ${plan['status']}'),
                      if (sub?['adminReason'] != null &&
                          '${sub?['adminReason']}'.isNotEmpty)
                        Text('${sub?['adminReason']}'),
                      Text('${_money(plan['price'])} / ${plan['interval']}'),
                      Text(
                        '${plan['videoQuotaRemaining']} of ${plan['videoQuota']} video downloads remaining',
                      ),
                      LinearProgressIndicator(
                        value: _number(plan['videoQuota']) > 0
                            ? (_number(plan['usedQuota']) /
                                      _number(plan['videoQuota']))
                                  .clamp(0, 1)
                                  .toDouble()
                            : 0,
                      ),
                      Text('Started: ${_date(plan['startDate'])}'),
                      Text('Period ends: ${_date(plan['endDate'])}'),
                      Text(
                        _number(plan['price']) == 0
                            ? 'Free plan · no automatic charges'
                            : plan['cancelAtPeriodEnd'] == true
                            ? 'AutoPay cancelled for the next cycle. Access continues until the period ends.'
                            : plan['status'] == 'active'
                            ? 'AutoPay enabled · renews each billing cycle'
                            : 'Subscription is ${plan['status']}',
                      ),
                      if (_number(plan['price']) > 0 &&
                          plan['status'] == 'active' &&
                          plan['cancelAtPeriodEnd'] != true)
                        OutlinedButton(
                          onPressed: _busy ? null : () => _cancel(plan),
                          child: const Text('Cancel AutoPay'),
                        ),
                      if (plan['id'] != null)
                        TextButton(
                          onPressed: _busy
                              ? null
                              : () => _action(() async {
                                  final bytes = await (await _service())
                                      .invoice('${plan['id']}');
                                  await Printing.sharePdf(
                                    bytes: Uint8List.fromList(bytes),
                                    filename:
                                        'subscription-invoice-${plan['id']}.pdf',
                                  );
                                }),
                          child: const Text('Download tax invoice'),
                        ),
                    ],
                  ),
                if (_busy) const LinearProgressIndicator(),
                FilledButton(
                  onPressed: () => context.push('/subscriptions'),
                  child: const Text('Browse plans'),
                ),
                TextButton(
                  onPressed: () => context.push('/subscription-policy'),
                  child: const Text('Subscription policy'),
                ),
                if (_maps(sub?['downloadedVideos']).isNotEmpty) ...[
                  Text(
                    'Download history',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  for (final video in _maps(sub?['downloadedVideos']))
                    ListTile(
                      title: Text(
                        '${video['name'] ?? video['title'] ?? video['productTitle'] ?? 'Editorial video'}',
                      ),
                      subtitle: Text(
                        _date(video['downloadedAt'] ?? video['claimedAt']),
                      ),
                      onTap: video['orderId'] == null
                          ? null
                          : () => context.push('/orders/${video['orderId']}'),
                    ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class SubscriptionSuccessScreen extends StatelessWidget {
  const SubscriptionSuccessScreen({super.key});
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Subscription confirmed')),
    body: ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Icon(Icons.check_circle_outline, size: 64, color: Colors.green),
        const SizedBox(height: 24),
        Text(
          'Your subscription is active',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        const Text(
          'Your dedicated WhatsApp group will be created within 6 hours of successful payment confirmation. View your plan, downloads, invoices, and AutoPay in your account.',
        ),
        const SizedBox(height: 24),
        FilledButton(
          onPressed: () => context.go('/my-subscription'),
          child: const Text('View my subscription'),
        ),
        TextButton(
          onPressed: () => context.go('/videos'),
          child: const Text('Browse videos'),
        ),
      ],
    ),
  );
}

const _agreementLinkStyle = TextStyle(
  fontSize: 12,
  color: Color(0xFF1463FF),
  decoration: TextDecoration.underline,
  decorationColor: Color(0xFF1463FF),
);

class _AgreementRow extends StatelessWidget {
  const _AgreementRow({
    required this.value,
    required this.onChanged,
    required this.label,
    required this.spans,
  });
  final bool value;
  final ValueChanged<bool?>? onChanged;
  final String label;
  final List<InlineSpan> spans;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Checkbox(value: value, onChanged: onChanged, semanticLabel: label),
      const SizedBox(width: 6),
      Expanded(
        child: Padding(
          padding: const EdgeInsets.only(top: 12),
          child: Text.rich(
            TextSpan(children: spans),
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
              height: 1.5,
            ),
          ),
        ),
      ),
    ],
  );
}

class _Panel extends StatelessWidget {
  const _Panel({required this.children, this.badge, this.accentColor, this.compact = false});
  final List<Widget> children;
  final String? badge;
  final Color? accentColor;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final label = badge?.trim() ?? '';
    final color = accentColor ?? Theme.of(context).colorScheme.primary;
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final child in children)
          Padding(
            padding: EdgeInsets.symmetric(vertical: compact ? 3 : 6),
            child: child,
          ),
      ],
    );
    if (label.isEmpty) {
      return Card(
        margin: const EdgeInsets.only(bottom: 16),
        child: Padding(padding: const EdgeInsets.all(16), child: content),
      );
    }
    return LayoutBuilder(
      builder: (context, constraints) {
        final badgeStyle = Theme.of(context).textTheme.labelLarge!.copyWith(
          fontWeight: FontWeight.bold,
          color: color == const Color(0xFFD4AF37)
              ? const Color(0xFF302300)
              : Colors.white,
        );
        // Measure wrapped/scaled text so the border always bisects the badge.
        final painter =
            TextPainter(
              text: TextSpan(text: label, style: badgeStyle),
              textDirection: Directionality.of(context),
              textScaler: MediaQuery.textScalerOf(context),
            )..layout(
              maxWidth: (constraints.maxWidth - 91).clamp(1, double.infinity),
            );
        final badgeHeight = painter.height + 11;
        painter.dispose();
        return Padding(
          padding: EdgeInsets.only(top: badgeHeight / 2 + 12, bottom: 16),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Card(
                margin: EdgeInsets.zero,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: BorderSide(color: color, width: 1.5),
                ),
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                    16,
                    badgeHeight / 2 + 12,
                    16,
                    16,
                  ),
                  child: content,
                ),
              ),
              Positioned(
                top: -badgeHeight / 2,
                left: 24,
                right: 24,
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: color,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: color, width: 1.5),
                    ),
                    child: Text(
                      label,
                      textAlign: TextAlign.center,
                      style: badgeStyle,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _AsyncContent extends StatelessWidget {
  const _AsyncContent({
    required this.future,
    required this.retry,
    required this.builder,
  });
  final Future<Map<String, dynamic>> future;
  final VoidCallback retry;
  final Widget Function(Map<String, dynamic>) builder;
  @override
  Widget build(BuildContext context) => FutureBuilder<Map<String, dynamic>>(
    future: future,
    builder: (context, snapshot) {
      if (snapshot.connectionState != ConnectionState.done) {
        return const Center(child: CircularProgressIndicator());
      }
      if (snapshot.hasError) {
        return Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(ApiClient.unwrapError(snapshot.error!).toString()),
                const SizedBox(height: 16),
                FilledButton(onPressed: retry, child: const Text('Retry')),
              ],
            ),
          ),
        );
      }
      return builder(snapshot.data ?? {});
    },
  );
}
