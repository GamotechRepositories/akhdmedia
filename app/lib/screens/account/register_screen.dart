import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/auth_navigation.dart';
import '../../core/utils/phone_utils.dart';
import '../../core/utils/google_sign_in_setup.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/api_client.dart';
import '../../services/google_sign_in_service.dart';
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

class _RegisterScreenState extends State<RegisterScreen>
    with WidgetsBindingObserver {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneFieldKey = GlobalKey<PhoneCountryFieldState>();
  final _phoneCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  bool _submitting = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _acceptedTerms = false;
  bool _googleSignInInFlight = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _passwordCtrl.addListener(_onPasswordFieldsChanged);
    _confirmPasswordCtrl.addListener(_onPasswordFieldsChanged);
  }

  void _onPasswordFieldsChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _passwordCtrl
      ..removeListener(_onPasswordFieldsChanged)
      ..dispose();
    _confirmPasswordCtrl
      ..removeListener(_onPasswordFieldsChanged)
      ..dispose();
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _googleSignInInFlight) {
      _completeGoogleSignInIfReady();
    }
  }

  String get _redirectQuery {
    final redirect = widget.redirectTo;
    if (redirect == null || redirect.isEmpty) return '';
    return '?redirect=${Uri.encodeComponent(redirect)}';
  }

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

  Future<void> _completeGoogleSignInIfReady() async {
    final auth = context.read<AuthProvider>();
    if (auth.isAuthenticated) {
      _googleSignInInFlight = false;
      await context.read<CartProvider>().loadCart();
      if (!mounted) return;
      _navigateAfterAuth();
      return;
    }

    await auth.bootstrap();
    if (!mounted || !_googleSignInInFlight) return;

    if (auth.isAuthenticated) {
      _googleSignInInFlight = false;
      await context.read<CartProvider>().loadCart();
      if (!mounted) return;
      _navigateAfterAuth();
    }
  }

  Future<void> _submit() async {
    if (!_acceptedTerms) {
      await showAuthErrorDialog(
        context,
        title: 'Registration failed',
        message: 'Please accept the Terms & Conditions and Privacy Policy.',
      );
      return;
    }

    if (_passwordCtrl.text != _confirmPasswordCtrl.text) {
      await showAuthErrorDialog(
        context,
        title: 'Registration failed',
        message: 'Passwords do not match',
      );
      return;
    }

    if (_passwordCtrl.text.length < 6) {
      await showAuthErrorDialog(
        context,
        title: 'Registration failed',
        message: 'Password must be at least 6 characters',
      );
      return;
    }

    final phone = _phoneFieldKey.currentState?.internationalPhone ?? '';
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
      await context.read<CartProvider>().loadCart();
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
    setState(() {
      _submitting = true;
      _googleSignInInFlight = true;
    });

    try {
      final outcome = await context.read<AuthProvider>().signInWithGoogle();
      if (!mounted) return;

      if (outcome == GoogleSignInOutcome.success) {
        _googleSignInInFlight = false;
        await context.read<CartProvider>().loadCart();
        if (!mounted) return;
        _navigateAfterAuth();
        return;
      }

      if (outcome == GoogleSignInOutcome.cancelled) {
        _googleSignInInFlight = false;
        await showAuthErrorDialog(
          context,
          title: 'Google sign-in not completed',
          message: GoogleSignInSetup.cancelledAfterAccountSelection(),
        );
      }
    } catch (e) {
      if (!mounted) return;
      _googleSignInInFlight = false;
      await showAuthErrorDialog(
        context,
        title: 'Google sign-in failed',
        message: ApiClient.unwrapError(e).toString(),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final loading = _submitting || auth.loading;
    final showPasswordMatchHint = _confirmPasswordCtrl.text.isNotEmpty;

    return AuthScreenShell(
      backEnabled: !loading,
      onBack: () {
        final router = GoRouter.of(context);
        if (router.canPop()) {
          router.pop();
        } else {
          router.go('/login$_redirectQuery');
        }
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AuthLogoHeader(
            compact: true,
            title: 'Join AKHD Media',
            subtitle: 'Create your account in under a minute',
          ),
          const SizedBox(height: 10),
          Center(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: AuthScreenColors.primaryBlue.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: AuthScreenColors.primaryBlue.withValues(alpha: 0.15),
                ),
              ),
              child: const Text(
                'Editorial footage · Licensed downloads',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AuthScreenColors.primaryBlue,
                ),
              ),
            ),
          ),
          const SizedBox(height: AuthScreenMetrics.sectionGap),
          GoogleSignInButton(disabled: loading, onPressed: _googleSignIn),
          const SizedBox(height: AuthScreenMetrics.fieldGap),
          const AuthOrDivider(),
          const SizedBox(height: AuthScreenMetrics.fieldGap),
          AuthFormCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const AuthSectionLabel(label: 'Your details'),
                AuthStyledField(
                  label: 'Full Name',
                  controller: _nameCtrl,
                  hint: 'Your full name',
                  prefixIcon: Icons.person_outline_rounded,
                  textInputAction: TextInputAction.next,
                  enabled: !loading,
                ),
                const SizedBox(height: AuthScreenMetrics.fieldGap),
                AuthStyledField(
                  label: 'Email Address',
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  hint: 'you@example.com',
                  prefixIcon: Icons.mail_outline_rounded,
                  textInputAction: TextInputAction.next,
                  enabled: !loading,
                ),
                const SizedBox(height: AuthScreenMetrics.fieldGap),
                PhoneCountryField(
                  key: _phoneFieldKey,
                  controller: _phoneCtrl,
                  enabled: !loading,
                ),
                const SizedBox(height: 14),
                const AuthSectionLabel(label: 'Security'),
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
                    onPressed: () =>
                        setState(() => _obscurePassword = !_obscurePassword),
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
                    onPressed: () => setState(
                      () => _obscureConfirmPassword = !_obscureConfirmPassword,
                    ),
                    icon: Icon(
                      _obscureConfirmPassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: AuthScreenColors.textMuted,
                      size: 18,
                    ),
                  ),
                ),
                if (showPasswordMatchHint) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(
                        _passwordsMatch
                            ? Icons.check_circle_rounded
                            : Icons.error_outline_rounded,
                        size: 14,
                        color: _passwordsMatch
                            ? const Color(0xFF16A34A)
                            : const Color(0xFFDC2626),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        _passwordsMatch
                            ? 'Passwords match'
                            : 'Passwords do not match',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: _passwordsMatch
                              ? const Color(0xFF16A34A)
                              : const Color(0xFFDC2626),
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 12),
                AuthTermsCheckbox(
                  value: _acceptedTerms,
                  enabled: !loading,
                  onChanged: (value) =>
                      setState(() => _acceptedTerms = value ?? false),
                  onTermsTap: () => context.push('/terms-and-conditions'),
                  onPrivacyTap: () => context.push('/privacy-policy'),
                ),
              ],
            ),
          ),
          const SizedBox(height: AuthScreenMetrics.sectionGap),
          AuthActionButton(
            label: 'Create Account',
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
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}
