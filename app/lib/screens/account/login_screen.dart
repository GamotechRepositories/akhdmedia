import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/auth_navigation.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/api_client.dart';
import '../../services/google_sign_in_service.dart';
import '../../widgets/auth/auth_modal_shell.dart' show showAuthErrorDialog;
import '../../widgets/auth/auth_screen_layout.dart';
import '../../widgets/auth/google_sign_in_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.redirectTo});

  final String? redirectTo;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with WidgetsBindingObserver {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _submitting = false;
  bool _obscurePassword = true;
  bool _rememberMe = true;
  bool _googleSignInInFlight = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
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
    setState(() => _submitting = true);

    try {
      await context.read<AuthProvider>().login(
            _emailCtrl.text.trim(),
            _passwordCtrl.text,
          );
      if (!mounted) return;
      await context.read<CartProvider>().loadCart();
      if (!mounted) return;
      _navigateAfterAuth();
    } catch (e) {
      if (!mounted) return;
      await showAuthErrorDialog(
        context,
        title: 'Login failed',
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

    return AuthScreenShell(
      scrollable: false,
      backEnabled: !loading,
      onBack: () => context.pop(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const AuthLogoHeader(
            compact: true,
            title: 'Welcome Back 👋',
            subtitle: 'Login to continue to your account',
          ),
          const SizedBox(height: AuthScreenMetrics.sectionGap),
          GoogleSignInButton(disabled: loading, onPressed: _googleSignIn),
          const SizedBox(height: AuthScreenMetrics.fieldGap),
          const AuthOrDivider(),
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
          AuthStyledField(
            label: 'Password',
            controller: _passwordCtrl,
            hint: 'Enter your password',
            prefixIcon: Icons.lock_outline_rounded,
            obscureText: _obscurePassword,
            textInputAction: TextInputAction.done,
            onSubmitted: (_) => _submit(),
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
          const SizedBox(height: 6),
          Row(
            children: [
              SizedBox(
                height: 20,
                width: 20,
                child: Checkbox(
                  value: _rememberMe,
                  onChanged: loading
                      ? null
                      : (value) => setState(() => _rememberMe = value ?? false),
                  activeColor: AuthScreenColors.primaryBlue,
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  visualDensity: VisualDensity.compact,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                  side: BorderSide(color: Colors.grey.shade400),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                'Remember me',
                style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
              ),
              const Spacer(),
              TextButton(
                onPressed: loading
                    ? null
                    : () => context.push('/forgot-password$_redirectQuery'),
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'Forgot Password?',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AuthScreenColors.primaryBlue,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AuthScreenMetrics.sectionGap),
          AuthActionButton(label: 'Login', loading: loading, onPressed: _submit),
          const SizedBox(height: AuthScreenMetrics.sectionGap),
          AuthFooterLink(
            prompt: "Don't have an account? ",
            actionLabel: 'Sign Up',
            enabled: !loading,
            onTap: () => context.pushReplacement('/register$_redirectQuery'),
          ),
        ],
      ),
    );
  }
}
