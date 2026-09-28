import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/api_client.dart';
import '../../widgets/auth/auth_modal_shell.dart' show showAuthErrorDialog;
import '../../widgets/auth/auth_screen_layout.dart';
import '../../widgets/auth/otp_digit_fields.dart';

enum _DeleteStep { reason, confirm }

class DeleteAccountScreen extends StatefulWidget {
  const DeleteAccountScreen({super.key});

  @override
  State<DeleteAccountScreen> createState() => _DeleteAccountScreenState();
}

class _DeleteAccountScreenState extends State<DeleteAccountScreen> {
  final _reasonCtrl = TextEditingController();
  final _otpFieldsKey = GlobalKey<OtpDigitFieldsState>();
  _DeleteStep _step = _DeleteStep.reason;
  String _otpCode = '';
  bool _submitting = false;

  @override
  void dispose() {
    _reasonCtrl.dispose();
    super.dispose();
  }

  bool get _otpReady => RegExp(r'^\d{6}$').hasMatch(_otpCode);

  Future<void> _requestDeletion() async {
    final reason = _reasonCtrl.text.trim();
    if (reason.length < 5) {
      await showAuthErrorDialog(
        context,
        title: 'Reason required',
        message: 'Please share at least 5 characters explaining why you are deleting your account.',
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final message =
          await context.read<AuthProvider>().requestAccountDeletion(reason);
      if (!mounted) return;
      setState(() {
        _step = _DeleteStep.confirm;
        _otpCode = '';
      });
      _otpFieldsKey.currentState?.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } catch (e) {
      if (!mounted) return;
      await showAuthErrorDialog(
        context,
        title: 'Could not start deletion',
        message: ApiClient.unwrapError(e).toString(),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _confirmDeletion() async {
    if (!_otpReady) {
      await showAuthErrorDialog(
        context,
        title: 'Invalid code',
        message: 'Enter the 6-digit confirmation code from your email.',
      );
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete account permanently?'),
        content: const Text(
          'This cannot be undone. Your account and profile data will be removed. '
          'Purchased licenses you already received by email will remain valid per our policies.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete account'),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    setState(() => _submitting = true);
    try {
      await context.read<CartProvider>().clearOnLogout();
      if (!mounted) return;
      await context.read<AuthProvider>().confirmAccountDeletion(_otpCode);
      if (!mounted) return;
      context.go('/');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Your account has been deleted')),
      );
    } catch (e) {
      if (!mounted) return;
      await showAuthErrorDialog(
        context,
        title: 'Deletion failed',
        message: ApiClient.unwrapError(e).toString(),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (!auth.isAuthenticated) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (context.mounted) {
          context.go('/login?redirect=${Uri.encodeComponent('/delete-account')}');
        }
      });
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    final email = auth.user?.email ?? 'your email';
    final isConfirmStep = _step == _DeleteStep.confirm;

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: const Color(0xFF0F172A),
        title: const Text(
          'Delete Account',
          style: TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(24, 8, 24, 32),
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFFECACA)),
            ),
            child: const Text(
              'Account deletion is permanent. You will receive a confirmation code by email before your account is removed.',
              style: TextStyle(fontSize: 13, color: Color(0xFF991B1B), height: 1.35),
            ),
          ),
          const SizedBox(height: 20),
          if (!isConfirmStep) ...[
            AuthStyledField(
              label: 'Why are you leaving? *',
              controller: _reasonCtrl,
              hint: 'Tell us briefly (at least 5 characters)',
              prefixIcon: Icons.feedback_outlined,
              maxLines: 4,
              enabled: !_submitting,
            ),
            const SizedBox(height: AuthScreenMetrics.sectionGap),
            AuthActionButton(
              label: 'Send confirmation code',
              loading: _submitting,
              onPressed: _requestDeletion,
            ),
          ] else ...[
            Text(
              'We sent a 6-digit code to $email. Enter it below to permanently delete your account.',
              style: TextStyle(fontSize: 13, color: Colors.grey.shade700, height: 1.35),
            ),
            const SizedBox(height: 20),
            OtpDigitFields(
              key: _otpFieldsKey,
              enabled: !_submitting,
              onChanged: (code) => setState(() => _otpCode = code),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: _submitting
                  ? null
                  : () {
                      setState(() {
                        _step = _DeleteStep.reason;
                        _otpCode = '';
                      });
                    },
              child: const Text('Change reason and resend code'),
            ),
            const SizedBox(height: AuthScreenMetrics.sectionGap),
            AuthActionButton(
              label: 'Confirm account deletion',
              loading: _submitting,
              onPressed: _otpReady ? _confirmDeletion : null,
            ),
          ],
        ],
      ),
    );
  }
}
