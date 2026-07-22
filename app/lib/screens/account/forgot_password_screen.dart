import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_spacing.dart';
import '../../core/utils/auth_navigation.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/api_client.dart';
import '../../widgets/auth/auth_modal_shell.dart';
import '../../widgets/auth/otp_digit_fields.dart';

enum _ForgotStep { email, otp }

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key, this.redirectTo});

  final String? redirectTo;

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailCtrl = TextEditingController();
  final _otpFieldsKey = GlobalKey<OtpDigitFieldsState>();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  String _otpCode = '';
  bool _submitting = false;
  bool _resending = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  _ForgotStep _step = _ForgotStep.email;
  int _resendCooldown = 0;
  Timer? _resendTimer;

  @override
  void initState() {
    super.initState();
    _passwordCtrl.addListener(_onFieldsChanged);
    _confirmPasswordCtrl.addListener(_onFieldsChanged);
  }

  void _onFieldsChanged() {
    if (mounted) setState(() {});
  }

  void _startResendCooldown([int seconds = 300]) {
    _resendTimer?.cancel();
    setState(() => _resendCooldown = seconds);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_resendCooldown <= 1) {
        timer.cancel();
        setState(() => _resendCooldown = 0);
        return;
      }
      setState(() => _resendCooldown -= 1);
    });
  }

  void _clearOtp() {
    _otpCode = '';
    _otpFieldsKey.currentState?.clear();
  }

  @override
  void dispose() {
    _resendTimer?.cancel();
    _passwordCtrl
      ..removeListener(_onFieldsChanged)
      ..dispose();
    _confirmPasswordCtrl
      ..removeListener(_onFieldsChanged)
      ..dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  String get _loginPath {
    final redirect = widget.redirectTo;
    if (redirect == null || redirect.isEmpty) return '/login';
    return '/login?redirect=${Uri.encodeComponent(redirect)}';
  }

  String get _emailNormalized => _emailCtrl.text.trim().toLowerCase();

  bool get _otpReady => RegExp(r'^\d{6}$').hasMatch(_otpCode);

  bool get _passwordsMatch =>
      _passwordCtrl.text.isNotEmpty &&
      _confirmPasswordCtrl.text.isNotEmpty &&
      _passwordCtrl.text == _confirmPasswordCtrl.text;

  void _navigateAfterAuth() {
    completeAuthNavigation(
      GoRouter.of(context),
      redirectTo: widget.redirectTo,
    );
  }

  Future<void> _sendOtp() async {
    setState(() => _submitting = true);

    try {
      await context.read<AuthProvider>().requestPasswordReset(_emailNormalized);
      if (!mounted) return;
      setState(() {
        _step = _ForgotStep.otp;
        _clearOtp();
        _passwordCtrl.clear();
        _confirmPasswordCtrl.clear();
      });
      _startResendCooldown();
    } catch (e) {
      if (!mounted) return;
      final message = ApiClient.unwrapError(e).toString();
      await showAuthErrorDialog(
        context,
        title: message.toLowerCase().contains('no account')
            ? 'Account not found'
            : 'Could not send verification code',
        message: message,
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _verifyAndReset() async {
    if (!_otpReady) {
      await showAuthErrorDialog(
        context,
        title: 'Could not reset password',
        message: 'Please enter the 6-digit verification code',
      );
      return;
    }

    if (_passwordCtrl.text != _confirmPasswordCtrl.text) {
      await showAuthErrorDialog(
        context,
        title: 'Could not reset password',
        message: 'Passwords do not match',
      );
      return;
    }

    if (_passwordCtrl.text.length < 6) {
      await showAuthErrorDialog(
        context,
        title: 'Could not reset password',
        message: 'Password must be at least 6 characters',
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      await context.read<AuthProvider>().resetPasswordWithOtp(
            email: _emailNormalized,
            code: _otpCode,
            password: _passwordCtrl.text,
          );
      if (!mounted) return;
      await context.read<CartProvider>().loadCart();
      if (!mounted) return;
      _navigateAfterAuth();
    } catch (e) {
      if (!mounted) return;
      await showAuthErrorDialog(
        context,
        title: 'Could not reset password',
        message: ApiClient.unwrapError(e).toString(),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _resendOtp() async {
    if (_resendCooldown > 0 || _resending) return;

    setState(() => _resending = true);

    try {
      await context.read<AuthProvider>().resendPasswordResetOtp(_emailNormalized);
      if (!mounted) return;
      _startResendCooldown();
    } catch (e) {
      if (!mounted) return;
      await showAuthErrorDialog(
        context,
        title: 'Could not resend code',
        message: ApiClient.unwrapError(e).toString(),
      );
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = _submitting || _resending;
    final isOtpStep = _step == _ForgotStep.otp;

    return AuthModalShell(
      title: isOtpStep ? 'Verify & Set Password' : 'Forgot Password',
      subtitle: isOtpStep
          ? 'Enter the code from your email and choose a new password.'
          : "Enter your email and we'll send a verification code. Works for Google accounts too.",
      closeLabel: 'Close forgot password',
      onClose: () {
        if (isOtpStep && !loading) {
          setState(() {
            _step = _ForgotStep.email;
            _clearOtp();
            _passwordCtrl.clear();
            _confirmPasswordCtrl.clear();
          });
          return;
        }
        context.go(_loginPath);
      },
      child: AuthFormCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (!isOtpStep) ...[
              AuthTextField(
                label: 'Email',
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                placeholder: 'you@example.com',
                textInputAction: TextInputAction.done,
                enabled: !loading,
                onSubmitted: (_) => _sendOtp(),
              ),
              const SizedBox(height: AppSpacing.lg),
              AuthPrimaryButton(
                label: _submitting ? 'Sending...' : 'Send verification code',
                loading: _submitting,
                onPressed: loading ? null : _sendOtp,
              ),
            ] else ...[
              Text(
                'Enter the 6-digit code we sent to $_emailNormalized',
                style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  color: Colors.grey.shade700,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              OtpDigitFields(
                key: _otpFieldsKey,
                enabled: !loading,
                onChanged: (value) {
                  setState(() => _otpCode = value);
                },
              ),
              const SizedBox(height: AppSpacing.md),
              AuthTextField(
                label: 'New Password',
                controller: _passwordCtrl,
                placeholder: 'At least 6 characters',
                obscureText: _obscurePassword,
                textInputAction: TextInputAction.next,
                enabled: !loading,
                suffixIcon: IconButton(
                  padding: EdgeInsets.zero,
                  onPressed: () =>
                      setState(() => _obscurePassword = !_obscurePassword),
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 18,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              AuthTextField(
                label: 'Confirm Password',
                controller: _confirmPasswordCtrl,
                placeholder: 'Re-enter your password',
                obscureText: _obscureConfirmPassword,
                textInputAction: TextInputAction.done,
                enabled: !loading,
                onSubmitted: (_) {
                  if (_otpReady && _passwordsMatch) _verifyAndReset();
                },
                suffixIcon: IconButton(
                  padding: EdgeInsets.zero,
                  onPressed: () => setState(
                    () => _obscureConfirmPassword = !_obscureConfirmPassword,
                  ),
                  icon: Icon(
                    _obscureConfirmPassword
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 18,
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              AuthPrimaryButton(
                label: _submitting ? 'Updating...' : 'Verify & update password',
                loading: _submitting,
                onPressed: !loading && _otpReady && _passwordsMatch
                    ? _verifyAndReset
                    : null,
              ),
              const SizedBox(height: AppSpacing.md),
              TextButton(
                onPressed:
                    loading || _resendCooldown > 0 ? null : _resendOtp,
                child: Text(
                  _resending
                      ? 'Sending...'
                      : _resendCooldown > 0
                          ? 'Resend code in ${_resendCooldown ~/ 60}:${(_resendCooldown % 60).toString().padLeft(2, '0')}'
                          : 'Resend code',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: loading || _resendCooldown > 0
                        ? Colors.grey
                        : const Color(0xFF111827),
                  ),
                ),
              ),
              TextButton(
                onPressed: loading
                    ? null
                    : () => setState(() {
                          _step = _ForgotStep.email;
                          _clearOtp();
                          _passwordCtrl.clear();
                          _confirmPasswordCtrl.clear();
                        }),
                child: Text(
                  'Change email',
                  style: TextStyle(color: Colors.grey.shade600),
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
                      onTap: loading ? null : () => context.go(_loginPath),
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
