import 'dart:async';

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
import '../../widgets/auth/otp_digit_fields.dart';
import '../../widgets/auth/phone_country_field.dart';

enum _RegisterStep { details, otp }

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
  final _otpFieldsKey = GlobalKey<OtpDigitFieldsState>();
  String _otpCode = '';
  bool _submitting = false;
  bool _resending = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _acceptedTerms = false;
  bool _googleSignInInFlight = false;
  _RegisterStep _step = _RegisterStep.details;
  int _resendCooldown = 0;
  Timer? _resendTimer;

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

  void _startResendCooldown([int seconds = 60]) {
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

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _resendTimer?.cancel();
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

  String get _emailNormalized => _emailCtrl.text.trim().toLowerCase();

  bool get _passwordsMatch =>
      _passwordCtrl.text.isNotEmpty &&
      _confirmPasswordCtrl.text.isNotEmpty &&
      _passwordCtrl.text == _confirmPasswordCtrl.text;

  bool get _otpReady => RegExp(r'^\d{6}$').hasMatch(_otpCode);

  void _navigateAfterAuth() {
    completeAuthNavigation(
      GoRouter.of(context),
      redirectTo: widget.redirectTo,
    );
  }

  void _goBackToDetails() {
    setState(() {
      _step = _RegisterStep.details;
      _otpCode = '';
      _otpFieldsKey.currentState?.clear();
    });
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

  Future<void> _submitDetails() async {
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
      await context.read<AuthProvider>().sendRegisterOtp(
            name: _nameCtrl.text.trim(),
            email: _emailNormalized,
            phone: phone,
            password: _passwordCtrl.text,
          );
      if (!mounted) return;
      setState(() {
        _step = _RegisterStep.otp;
        _otpCode = '';
      });
      _startResendCooldown();
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _otpFieldsKey.currentState?.clear();
      });
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

  Future<void> _verifyOtp() async {
    if (!_otpReady) {
      await showAuthErrorDialog(
        context,
        title: 'Verification failed',
        message: 'Please enter the 6-digit verification code',
      );
      return;
    }

    setState(() => _submitting = true);

    try {
      await context.read<AuthProvider>().verifyRegisterOtp(
            email: _emailNormalized,
            code: _otpCode,
          );
      if (!mounted) return;
      await context.read<CartProvider>().loadCart();
      if (!mounted) return;
      _navigateAfterAuth();
    } catch (e) {
      if (!mounted) return;
      await showAuthErrorDialog(
        context,
        title: 'Verification failed',
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
      await context.read<AuthProvider>().resendRegisterOtp(_emailNormalized);
      if (!mounted) return;
      _startResendCooldown();
    } catch (e) {
      if (!mounted) return;
      await showAuthErrorDialog(
        context,
        title: 'Verification failed',
        message: ApiClient.unwrapError(e).toString(),
      );
    } finally {
      if (mounted) setState(() => _resending = false);
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
    final loading = _submitting || _resending || auth.loading;
    final showPasswordMatchHint = _confirmPasswordCtrl.text.isNotEmpty;
    final isOtpStep = _step == _RegisterStep.otp;

    return AuthScreenShell(
      backEnabled: !loading,
      scrollable: !isOtpStep,
      centerContent: isOtpStep,
      onBack: () {
        if (isOtpStep) {
          _goBackToDetails();
          return;
        }
        final router = GoRouter.of(context);
        if (router.canPop()) {
          router.pop();
        } else {
          router.go('/login$_redirectQuery');
        }
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: isOtpStep ? MainAxisSize.min : MainAxisSize.max,
        children: [
          AuthLogoHeader(
            compact: true,
            title: isOtpStep ? 'Verify Email' : 'Join AKHD Media',
            subtitle: isOtpStep
                ? 'Enter the code we sent to your email'
                : 'Create your account in under a minute',
          ),
          if (!isOtpStep) ...[
            const SizedBox(height: 10),
            Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AuthScreenColors.primaryBlue.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color:
                        AuthScreenColors.primaryBlue.withValues(alpha: 0.15),
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
                      onPressed: () => setState(
                          () => _obscurePassword = !_obscurePassword),
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
                    onSubmitted: (_) => _submitDetails(),
                    enabled: !loading,
                    suffixIcon: IconButton(
                      padding: EdgeInsets.zero,
                      onPressed: () => setState(() =>
                          _obscureConfirmPassword = !_obscureConfirmPassword),
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
              label: 'Send verification code',
              loading: loading,
              onPressed: _submitDetails,
            ),
          ] else ...[
            const SizedBox(height: AuthScreenMetrics.sectionGap),
            AuthFormCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Enter the 6-digit code we sent to $_emailNormalized',
                    style: const TextStyle(
                      fontSize: 13,
                      height: 1.4,
                      color: AuthScreenColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: AuthScreenMetrics.fieldGap),
                  OtpDigitFields(
                    key: _otpFieldsKey,
                    enabled: !loading,
                    onChanged: (value) {
                      setState(() => _otpCode = value);
                    },
                    onCompleted: (_) {
                      if (_otpReady && !_resending) {
                        _verifyOtp();
                      }
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: AuthScreenMetrics.sectionGap),
            AuthActionButton(
              label: 'Verify & create account',
              loading: _submitting || auth.loading,
              onPressed: _otpReady && !_resending ? _verifyOtp : null,
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed:
                  loading || _resendCooldown > 0 ? null : _resendOtp,
              child: Text(
                _resending
                    ? 'Sending...'
                    : _resendCooldown > 0
                        ? 'Resend code in ${_resendCooldown}s'
                        : 'Resend code',
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: loading || _resendCooldown > 0
                      ? AuthScreenColors.textMuted
                      : AuthScreenColors.textDark,
                ),
              ),
            ),
            TextButton(
              onPressed: loading ? null : _goBackToDetails,
              child: const Text(
                'Change email / details',
                style: TextStyle(
                  color: AuthScreenColors.textMuted,
                ),
              ),
            ),
          ],
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
