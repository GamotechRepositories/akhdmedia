import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_spacing.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../../widgets/auth/auth_modal_shell.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key, this.redirectTo});

  final String? redirectTo;

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  bool _submitting = false;
  String? _successMessage;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  String get _loginPath {
    final redirect = widget.redirectTo;
    if (redirect == null || redirect.isEmpty) return '/login';
    return '/login?redirect=${Uri.encodeComponent(redirect)}';
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _successMessage = null;
    });

    try {
      final message = await context.read<AuthProvider>().requestPasswordReset(
            _emailCtrl.text.trim(),
          );
      if (!mounted) return;
      setState(() {
        _successMessage = message;
        _emailCtrl.clear();
      });
    } catch (e) {
      if (!mounted) return;
      await showAuthErrorDialog(
        context,
        title: 'Could not send reset email',
        message: ApiClient.unwrapError(e).toString(),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthModalShell(
      title: 'Forgot Password',
      subtitle: "Enter your email and we'll send you a reset link.",
      closeLabel: 'Close forgot password',
      onClose: () => context.go(_loginPath),
      child: AuthFormCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AuthTextField(
              label: 'Email',
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              placeholder: 'you@example.com',
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _submit(),
            ),
            const SizedBox(height: AppSpacing.lg),
            AuthPrimaryButton(
              label: _submitting ? 'Sending...' : 'Send Reset Link',
              loading: _submitting,
              onPressed: _submit,
            ),
            if (_successMessage != null) ...[
              const SizedBox(height: AppSpacing.md),
              Text(
                _successMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 13,
                  color: Color(0xFF111827),
                ),
              ),
            ],
            const SizedBox(height: AppSpacing.lg),
            Text.rich(
              textAlign: TextAlign.center,
              TextSpan(
                style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                children: [
                  const TextSpan(text: 'Remember your password? '),
                  WidgetSpan(
                    alignment: PlaceholderAlignment.baseline,
                    baseline: TextBaseline.alphabetic,
                    child: GestureDetector(
                      onTap: _submitting ? null : () => context.go(_loginPath),
                      child: const Text(
                        'Sign in',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF111827),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
