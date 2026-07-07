import 'dart:async';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:printing/printing.dart';
import 'package:provider/provider.dart';

import '../../core/constants/brand.dart';
import '../../core/constants/email_constants.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/order_formatters.dart';
import '../../models/order.dart';
import '../../models/order_item.dart';
import '../../services/order_service.dart';
import '../../widgets/common/error_view.dart';
import '../../widgets/common/loading_view.dart';

class OrderDetailScreen extends StatefulWidget {
  const OrderDetailScreen({
    super.key,
    required this.orderId,
    this.fromOrders = false,
  });

  final String orderId;
  final bool fromOrders;

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

/// Checkout success route alias.
class OrderSuccessScreen extends StatelessWidget {
  const OrderSuccessScreen({super.key, this.orderId});

  final String? orderId;

  @override
  Widget build(BuildContext context) {
    final id = orderId ?? GoRouterState.of(context).uri.queryParameters['orderId'] ?? '';
    final fromOrders = GoRouterState.of(context).uri.queryParameters['fromOrders'] == '1';
    return OrderDetailScreen(orderId: id, fromOrders: fromOrders);
  }
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  Order? _order;
  bool _loading = true;
  bool _resending = false;
  bool _showSupportDialog = false;
  String? _error;
  String? _emailNotice;
  int _resendWindowRemainingMs = 0;
  Timer? _resendTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadOrder());
  }

  @override
  void dispose() {
    _resendTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadOrder() async {
    if (widget.orderId.isEmpty) {
      setState(() {
        _loading = false;
        _error = 'Order not found';
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final order = await context.read<OrderService>().getOrder(widget.orderId);
      if (!mounted) return;
      setState(() {
        _order = order;
        _loading = false;
      });
      _startResendTimer(order);
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _loading = false;
        });
      }
    }
  }

  void _startResendTimer(Order order) {
    _resendTimer?.cancel();
    final endsAt = order.licenseEmailResendWindowEndsAt;
    if (endsAt == null) {
      setState(() => _resendWindowRemainingMs = 0);
      return;
    }

    void tick() {
      final remaining = endsAt.difference(DateTime.now()).inMilliseconds;
      if (!mounted) return;
      setState(() => _resendWindowRemainingMs = remaining > 0 ? remaining : 0);
    }

    tick();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (_) => tick());
  }

  void _handleContinue() {
    if (widget.fromOrders) {
      context.go('/orders?focus=${widget.orderId}');
      return;
    }
    context.go('/');
  }

  bool get _isResendWindowOpen => _resendWindowRemainingMs > 0;

  bool get _canResendEmail {
    final order = _order;
    if (order == null) return false;
    return _isResendWindowOpen && order.licenseEmailResendsRemaining > 0;
  }

  Future<void> _resendEmail() async {
    final order = _order;
    if (order == null || _resending) return;

    if (!_canResendEmail) {
      if (!_isResendWindowOpen && order.licenseEmailResendsRemaining > 0) {
        setState(() => _emailNotice = EmailConstants.licenseEmailResendWindowExpiredMessage);
        return;
      }
      setState(() => _showSupportDialog = true);
      return;
    }

    setState(() {
      _resending = true;
      _emailNotice = null;
    });

    try {
      await context.read<OrderService>().resendLicenseEmail(order.id);
      if (!mounted) return;
      setState(() {
        _emailNotice = 'License email sent to ${order.billingAddress.email}.';
      });
      await _loadOrder();
    } catch (e) {
      final message = e.toString();
      if (message.contains(EmailConstants.licenseEmailResendLimitMessage) ||
          message.contains(EmailConstants.licenseEmailResendWindowExpiredMessage)) {
        if (mounted) setState(() => _showSupportDialog = true);
      } else if (mounted) {
        setState(() => _emailNotice = message);
      }
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  Future<void> _downloadLicense() async {
    final order = _order;
    if (order == null) return;
    try {
      final bytes = await context.read<OrderService>().downloadLicenseCertificate(order.id);
      await Printing.sharePdf(
        bytes: Uint8List.fromList(bytes),
        filename: 'license-${order.shortOrderNumber}.pdf',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not download certificate: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF9FAFB),
        body: LoadingView(),
      );
    }

    if (_error != null && _order == null) {
      return Scaffold(
        appBar: AppBar(),
        body: ErrorView(message: _error!, onRetry: _loadOrder),
      );
    }

    final order = _order!;

    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF9FAFB),
        elevation: 0,
        scrolledUnderElevation: 0,
      ),
      body: Stack(
        children: [
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: _LicenseIssuedCard(
                  order: order,
                  resendWindowRemainingMs: _resendWindowRemainingMs,
                  isResendWindowOpen: _isResendWindowOpen,
                  canResendEmail: _canResendEmail,
                  resending: _resending,
                  emailNotice: _emailNotice,
                  fromOrders: widget.fromOrders,
                  onResend: _resendEmail,
                  onDownload: _downloadLicense,
                  onContinue: _handleContinue,
                ),
              ),
            ),
          ),
          if (_showSupportDialog) _SupportDialog(order: order, onClose: () => setState(() => _showSupportDialog = false)),
        ],
      ),
    );
  }
}

class _LicenseIssuedCard extends StatelessWidget {
  const _LicenseIssuedCard({
    required this.order,
    required this.resendWindowRemainingMs,
    required this.isResendWindowOpen,
    required this.canResendEmail,
    required this.resending,
    required this.emailNotice,
    required this.fromOrders,
    required this.onResend,
    required this.onDownload,
    required this.onContinue,
  });

  final Order order;
  final int resendWindowRemainingMs;
  final bool isResendWindowOpen;
  final bool canResendEmail;
  final bool resending;
  final String? emailNotice;
  final bool fromOrders;
  final VoidCallback onResend;
  final VoidCallback onDownload;
  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    final customerEmail = order.billingAddress.email;
    final resendsRemaining = order.licenseEmailResendsRemaining;

    return _OrderCardShell(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.md),
          child: Column(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: const Color(0xFFDCFCE7),
                child: const Icon(Icons.check_rounded, color: Color(0xFF16A34A), size: 32),
              ),
              const SizedBox(height: AppSpacing.md),
              const Text('License Issued', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text(
                'Order #${order.shortOrderNumber}',
                style: TextStyle(fontSize: 13, color: Colors.grey.shade500),
              ),
            ],
          ),
        ),
        if (order.isPaid && order.items.isNotEmpty)
          Container(
            width: double.infinity,
            color: const Color(0xFFF1F5F9),
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              children: [
                for (var i = 0; i < order.items.length; i++) ...[
                  if (i > 0) const Divider(height: 24),
                  _LicensedItemBlock(item: order.items[i]),
                ],
              ],
            ),
          ),
        if (order.isPaid && order.items.isNotEmpty)
          Container(
            width: double.infinity,
            color: const Color(0xFFECFDF5),
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Save this license for your records — download the certificate below or take a screenshot of this page.',
                  style: const TextStyle(fontSize: 11, color: Color(0xFF064E3B), height: 1.4),
                ),
                const SizedBox(height: AppSpacing.md),
                FilledButton.icon(
                  onPressed: onDownload,
                  style: FilledButton.styleFrom(backgroundColor: const Color(0xFF064E3B)),
                  icon: const Icon(Icons.download_rounded, size: 18),
                  label: const Text('Download license certificate'),
                ),
              ],
            ),
          ),
        Container(
          width: double.infinity,
          color: const Color(0xFFEFF6FF),
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('License email', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 6),
              Text(
                'License details, your video download link, and your license certificate (including usage terms) were sent to ${customerEmail.isEmpty ? 'your email' : customerEmail}. Please check your inbox and spam folder.',
                style: TextStyle(fontSize: 12, color: Colors.blue.shade900, height: 1.4),
              ),
              if (isResendWindowOpen && resendsRemaining > 0) ...[
                const SizedBox(height: 8),
                Text(
                  'Resend available for ${EmailConstants.formatResendWindowLabel(resendWindowRemainingMs)} ($resendsRemaining left).',
                  style: TextStyle(fontSize: 11, color: Colors.blue.shade800),
                ),
              ],
              if (!isResendWindowOpen && resendsRemaining > 0) ...[
                const SizedBox(height: 8),
                Text(
                  'The 5-minute resend window has ended. Contact support if you need help.',
                  style: TextStyle(fontSize: 11, color: Colors.blue.shade800),
                ),
              ],
              if (emailNotice != null) ...[
                const SizedBox(height: 8),
                Text(emailNotice!, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
              ],
              if (order.isPaid && resendsRemaining > 0 && isResendWindowOpen) ...[
                const SizedBox(height: AppSpacing.md),
                FilledButton(
                  onPressed: resending ? null : onResend,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF1E3A8A),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  ),
                  child: Text(
                    resending ? 'Sending…' : 'Resend license email',
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ],
          ),
        ),
        const _CompanyDetailsBlock(),
        _SummaryRows(
          rows: [
            ('Total paid', Formatters.currency(order.totalAmount), true),
            ('Payment', 'Online Payment', false),
            ('Date', OrderFormatters.formatDateShort(order.createdAt), false),
          ],
        ),
        Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: onContinue,
              child: Text(fromOrders ? 'Back to My Orders' : 'Continue Shopping'),
            ),
          ),
        ),
      ],
    );
  }
}

class _CompanyDetailsBlock extends StatelessWidget {
  const _CompanyDetailsBlock();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: const Color(0xFFF9FAFB),
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Seller details', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(Brand.name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          Text('GSTIN: ${Brand.gstNumber}', style: TextStyle(fontSize: 11, color: Colors.grey.shade700)),
          const SizedBox(height: 4),
          Text(
            Brand.companyAddress,
            style: TextStyle(fontSize: 11, color: Colors.grey.shade600, height: 1.4),
          ),
        ],
      ),
    );
  }
}

class _LicensedItemBlock extends StatelessWidget {
  const _LicensedItemBlock({required this.item});

  final OrderItem item;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(item.name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
        const SizedBox(height: 8),
        _LicenseDetailRow(label: 'Clip ID', value: item.clipId.isEmpty ? '—' : item.clipId, mono: true),
        _LicenseDetailRow(label: 'License tier', value: item.imageSize.isEmpty ? 'Standard' : item.imageSize),
        _LicenseDetailRow(label: 'License No', value: item.licenseNumber.isEmpty ? '—' : item.licenseNumber, mono: true),
        const SizedBox(height: 10),
        Text(
          'Download link sent to your email only.',
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Colors.grey.shade700),
        ),
      ],
    );
  }
}

class _LicenseDetailRow extends StatelessWidget {
  const _LicenseDetailRow({
    required this.label,
    required this.value,
    this.mono = false,
  });

  final String label;
  final String value;
  final bool mono;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: RichText(
        text: TextSpan(
          style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
          children: [
            TextSpan(text: '$label: '),
            TextSpan(
              text: value,
              style: TextStyle(
                color: Colors.grey.shade900,
                fontWeight: FontWeight.w600,
                fontFamily: mono ? 'monospace' : null,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SummaryRows extends StatelessWidget {
  const _SummaryRows({required this.rows});

  final List<(String, String, bool)> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: const Color(0xFFF5F5F4),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
      child: Column(
        children: rows.map((row) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(row.$1, style: TextStyle(fontSize: 13, color: Colors.grey.shade600)),
                Text(
                  row.$2,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: row.$3 ? FontWeight.w700 : FontWeight.w500,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _OrderCardShell extends StatelessWidget {
  const _OrderCardShell({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: children,
        ),
      ),
    );
  }
}

class _SupportDialog extends StatelessWidget {
  const _SupportDialog({required this.order, required this.onClose});

  final Order order;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black54,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 400),
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: Colors.amber.shade100,
                  child: Icon(Icons.mail_outline, color: Colors.amber.shade800),
                ),
                const SizedBox(height: AppSpacing.md),
                const Text('Contact Support', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                const SizedBox(height: AppSpacing.sm),
                Text(
                  EmailConstants.licenseEmailResendLimitMessage,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: Colors.grey.shade600, height: 1.4),
                ),
                const SizedBox(height: AppSpacing.lg),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: () {
                      onClose();
                      context.push(
                        '/support?subject=license_email&email=${Uri.encodeComponent(order.billingAddress.email)}&order=${Uri.encodeComponent(order.shortOrderNumber)}&message=${Uri.encodeComponent('I need help receiving my license/download email.')}',
                      );
                    },
                    child: const Text('Open Support Form'),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(onPressed: onClose, child: const Text('OK')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
