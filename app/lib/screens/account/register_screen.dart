import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/phone_utils.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_client.dart';
import '../../widgets/auth/google_sign_in_webview.dart';
import '../../widgets/auth/auth_modal_shell.dart' show showAuthErrorDialog;
import '../../widgets/auth/auth_screen_layout.dart';
import '../../widgets/auth/google_sign_in_button.dart';
import '../../widgets/auth/phone_country_field.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key, this.redirectTo});

  final String? redirectTo;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  bool _submitting = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  String get _redirectQuery {
    final redirect = widget.redirectTo;
    if (redirect == null || redirect.isEmpty) return '';
    return '?redirect=${Uri.encodeComponent(redirect)}';
  }

  void _navigateAfterAuth() {
    final redirect = widget.redirectTo;
    if (redirect != null && redirect.isNotEmpty) {
      context.go(redirect);
    } else {
      context.pop(true);
    }
  }

  Future<void> _submit() async {
    if (_passwordCtrl.text != _confirmPasswordCtrl.text) {
      await showAuthErrorDialog(
        context,
        title: 'Registration failed',
        message: 'Passwords do not match',
      );
      return;
    }

    final phone = normalizePhoneValue(_phoneCtrl.text);
    if (!isPhoneNumberValid(phone)) {
      await showAuthErrorDialog(
        context,
        title: 'Registration failed',
        message: 'Please enter a valid phone number',
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      await context.read<AuthProvider>().register(
            name: _nameCtrl.text.trim(),
            email: _emailCtrl.text.trim(),
            phone: phone,
            password: _passwordCtrl.text,
          );
      if (!mounted) return;
      _navigateAfterAuth();
    } catch (e) {
      if (!mounted) return;
      await showAuthErrorDialog(
        context,
        title: 'Registration failed',
        message: ApiClient.unwrapError(e).toString(),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _googleSignIn() async {
    setState(() => _submitting = true);
    try {
      final googleClientId =
          await context.read<AuthProvider>().getGoogleClientId();
      if (!mounted) return;

      final credential = await showGoogleSignInWebView(
        context,
        googleClientId: googleClientId,
      );
      if (!mounted || credential == null) return;

      await context.read<AuthProvider>().loginWithGoogleCredential(credential);
      if (!mounted) return;
      _navigateAfterAuth();
    } catch (e) {
      if (!mounted) return;
      await showAuthErrorDialog(
        context,
        title: 'Google sign-in failed',
        message: ApiClient.unwrapError(e).toString(),
      );
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (auth.isAuthenticated && !_submitting) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _navigateAfterAuth());
    }

    final loading = _submitting || auth.loading;

    return AuthScreenShell(
      backEnabled: !loading,
      onBack: () => context.pop(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AuthLogoHeader(
            compact: true,
            title: 'Create Account 🎉',
            subtitle: 'Sign up to get started',
          ),
          const SizedBox(height: AuthScreenMetrics.sectionGap),
          GoogleSignInButton(disabled: loading, onPressed: _googleSignIn),
          const SizedBox(height: AuthScreenMetrics.fieldGap),
          const AuthOrDivider(),
          const SizedBox(height: AuthScreenMetrics.fieldGap),
          AuthStyledField(
            label: 'Full Name',
            controller: _nameCtrl,
            hint: 'Enter your full name',
            prefixIcon: Icons.person_outline_rounded,
            textInputAction: TextInputAction.next,
            enabled: !loading,
          ),
          const SizedBox(height: AuthScreenMetrics.fieldGap),
          AuthStyledField(
            label: 'Email Address',
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            hint: 'Enter your email',
            prefixIcon: Icons.mail_outline_rounded,
            textInputAction: TextInputAction.next,
            enabled: !loading,
          ),
          const SizedBox(height: AuthScreenMetrics.fieldGap),
          PhoneCountryField(controller: _phoneCtrl, enabled: !loading),
          const SizedBox(height: AuthScreenMetrics.fieldGap),
          AuthStyledField(
            label: 'Password',
            controller: _passwordCtrl,
            hint: 'At least 6 characters',
            prefixIcon: Icons.lock_outline_rounded,
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.next,
            enabled: !loading,
            suffixIcon: IconButton(
              padding: EdgeInsets.zero,
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              icon: Icon(
                _obscurePassword
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
                color: AuthScreenColors.textMuted,
                size: 18,
              ),
            ),
          ),
          const SizedBox(height: AuthScreenMetrics.fieldGap),
          AuthStyledField(
            label: 'Confirm Password',
            controller: _confirmPasswordCtrl,
            hint: 'Re-enter your password',
            prefixIcon: Icons.lock_outline_rounded,
            obscureText: _obscureConfirmPassword,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _submit(),
            enabled: !loading,
            suffixIcon: IconButton(
              padding: EdgeInsets.zero,
              onPressed: () =>
                  setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
              icon: Icon(
                _obscureConfirmPassword
                    ? Icons.visibility_off_outlined
                    : Icons.visibility_outlined,
                color: AuthScreenColors.textMuted,
                size: 18,
              ),
            ),
          ),
          const SizedBox(height: AuthScreenMetrics.sectionGap),
          AuthActionButton(
            label: 'Sign Up',
            loading: loading,
            onPressed: _submit,
          ),
          const SizedBox(height: AuthScreenMetrics.sectionGap),
          AuthFooterLink(
            prompt: 'Already have an account? ',
            actionLabel: 'Sign In',
            enabled: !loading,
            onTap: () => context.pushReplacement('/login$_redirectQuery'),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
