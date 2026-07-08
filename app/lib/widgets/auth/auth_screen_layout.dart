import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

abstract final class AuthScreenColors {
  static const primaryBlue = Color(0xFF2563EB);
  static const textDark = Color(0xFF1E293B);
  static const textMuted = Color(0xFF64748B);
}

abstract final class AuthScreenMetrics {
  static const fieldRadius = 12.0;
  static const fieldHeight = 48.0;
  static const fieldGap = 10.0;
  static const sectionGap = 14.0;
}

OutlineInputBorder authFieldBorder({Color? color, double width = 1}) {
  return OutlineInputBorder(
    borderRadius: BorderRadius.circular(AuthScreenMetrics.fieldRadius),
    borderSide: BorderSide(color: color ?? const Color(0xFFE2E8F0), width: width),
  );
}

InputDecoration authFieldInputDecoration({
  required String hint,
  required IconData prefixIcon,
  Widget? suffixIcon,
}) {
  return InputDecoration(
    counterText: '',
    isDense: true,
    filled: true,
    fillColor: Colors.white,
    hintText: hint,
    hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
    prefixIcon: Icon(prefixIcon, color: Colors.grey.shade400, size: 20),
    prefixIconConstraints: const BoxConstraints(minWidth: 44, minHeight: 40),
    suffixIcon: suffixIcon,
    suffixIconConstraints: const BoxConstraints(minWidth: 40, minHeight: 40),
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    enabledBorder: authFieldBorder(),
    focusedBorder: authFieldBorder(color: AuthScreenColors.primaryBlue, width: 1.5),
    disabledBorder: authFieldBorder(color: const Color(0xFFF1F5F9)),
    border: authFieldBorder(),
  );
}

BoxDecoration authFieldDecoration() {
  return BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(AuthScreenMetrics.fieldRadius),
    border: Border.all(color: const Color(0xFFE2E8F0)),
  );
}

class AuthScreenShell extends StatelessWidget {
  const AuthScreenShell({
    super.key,
    required this.onBack,
    required this.child,
    this.backEnabled = true,
    this.showBack = true,
    this.scrollable = true,
    this.centerContent = false,
  });

  final VoidCallback? onBack;
  final Widget child;
  final bool backEnabled;
  final bool showBack;
  final bool scrollable;
  final bool centerContent;

  @override
  Widget build(BuildContext context) {
    final content = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showBack)
            Align(
              alignment: Alignment.centerLeft,
              child: IconButton(
                onPressed: backEnabled ? onBack : null,
                icon: Icon(
                  Icons.arrow_back_ios_new_rounded,
                  color: Colors.grey.shade600,
                  size: 18,
                ),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.white.withValues(alpha: 0.7),
                  padding: const EdgeInsets.all(8),
                  minimumSize: const Size(36, 36),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ),
            ),
          if (showBack) const SizedBox(height: 4),
          child,
        ],
      ),
    );

    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Stack(
        fit: StackFit.expand,
        children: [
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFFEFF6FF), Color(0xFFF8FAFC), Colors.white],
                stops: [0.0, 0.45, 1.0],
              ),
            ),
          ),
          Positioned(
            top: -40,
            right: -60,
            child: Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                color: AuthScreenColors.primaryBlue.withValues(alpha: 0.12),
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(100),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: CustomPaint(
              size: const Size(double.infinity, 80),
              painter: AuthWavePainter(),
            ),
          ),
          SafeArea(
            child: scrollable
                ? SingleChildScrollView(
                    keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                    child: content,
                  )
                : LayoutBuilder(
                    builder: (context, constraints) {
                      return SingleChildScrollView(
                        physics: const ClampingScrollPhysics(),
                        child: ConstrainedBox(
                          constraints: BoxConstraints(minHeight: constraints.maxHeight),
                          child: centerContent
                              ? Align(
                                  alignment: Alignment.center,
                                  child: content,
                                )
                              : content,
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class AuthLogoHeader extends StatelessWidget {
  const AuthLogoHeader({
    super.key,
    required this.title,
    required this.subtitle,
    this.compact = false,
  });

  final String title;
  final String subtitle;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    final logoSize = compact ? 60.0 : 72.0;

    return Column(
      children: [
        Center(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Image.asset(
              'assets/IMG_1577.jpg',
              width: logoSize,
              height: logoSize,
              fit: BoxFit.cover,
            ),
          ),
        ),
        SizedBox(height: compact ? 10 : 16),
        Text(
          title,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: compact ? 22 : 26,
            fontWeight: FontWeight.w800,
            color: AuthScreenColors.textDark,
            letterSpacing: -0.5,
            height: 1.1,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: compact ? 13 : 14,
            color: AuthScreenColors.textMuted,
            height: 1.3,
          ),
        ),
      ],
    );
  }
}

class AuthOrDivider extends StatelessWidget {
  const AuthOrDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Expanded(child: Divider(color: Colors.grey.shade300, thickness: 1)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Text(
              'OR',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade400,
                letterSpacing: 0.5,
              ),
            ),
          ),
          Expanded(child: Divider(color: Colors.grey.shade300, thickness: 1)),
        ],
      ),
    );
  }
}

class AuthStyledField extends StatelessWidget {
  const AuthStyledField({
    super.key,
    required this.label,
    required this.controller,
    required this.hint,
    required this.prefixIcon,
    this.keyboardType,
    this.obscureText = false,
    this.textInputAction,
    this.onSubmitted,
    this.suffixIcon,
    this.enabled = true,
    this.inputFormatters,
    this.maxLength,
  });

  final String label;
  final TextEditingController controller;
  final String hint;
  final IconData prefixIcon;
  final TextInputType? keyboardType;
  final bool obscureText;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onSubmitted;
  final Widget? suffixIcon;
  final bool enabled;
  final List<TextInputFormatter>? inputFormatters;
  final int? maxLength;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AuthScreenColors.textDark,
          ),
        ),
        const SizedBox(height: 5),
        TextField(
          controller: controller,
          enabled: enabled,
          keyboardType: keyboardType,
          obscureText: obscureText,
          textInputAction: textInputAction,
          onSubmitted: onSubmitted,
          inputFormatters: inputFormatters,
          maxLength: maxLength,
          style: const TextStyle(fontSize: 14, color: AuthScreenColors.textDark),
          decoration: authFieldInputDecoration(
            hint: hint,
            prefixIcon: prefixIcon,
            suffixIcon: suffixIcon,
          ),
        ),
      ],
    );
  }
}

class AuthActionButton extends StatelessWidget {
  const AuthActionButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool loading;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: AuthScreenMetrics.fieldHeight,
      child: FilledButton(
        onPressed: loading ? null : onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: AuthScreenColors.primaryBlue,
          foregroundColor: Colors.white,
          elevation: 2,
          shadowColor: AuthScreenColors.primaryBlue.withValues(alpha: 0.35),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AuthScreenMetrics.fieldRadius),
          ),
        ),
        child: loading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    label,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(width: 6),
                  const Icon(Icons.arrow_forward_rounded, size: 18),
                ],
              ),
      ),
    );
  }
}

class AuthFooterLink extends StatelessWidget {
  const AuthFooterLink({
    super.key,
    required this.prompt,
    required this.actionLabel,
    required this.onTap,
    this.enabled = true,
  });

  final String prompt;
  final String actionLabel;
  final VoidCallback? onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Text.rich(
      textAlign: TextAlign.center,
      TextSpan(
        style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
        children: [
          TextSpan(text: prompt),
          WidgetSpan(
            alignment: PlaceholderAlignment.baseline,
            baseline: TextBaseline.alphabetic,
            child: GestureDetector(
              onTap: enabled ? onTap : null,
              child: Text(
                actionLabel,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: AuthScreenColors.primaryBlue,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class AuthFormCard extends StatelessWidget {
  const AuthFormCard({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.96),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.8)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: child,
    );
  }
}

class AuthSectionLabel extends StatelessWidget {
  const AuthSectionLabel({super.key, required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.8,
          color: Colors.grey.shade500,
        ),
      ),
    );
  }
}

class AuthTermsCheckbox extends StatelessWidget {
  const AuthTermsCheckbox({
    super.key,
    required this.value,
    required this.onChanged,
    required this.onTermsTap,
    required this.onPrivacyTap,
    this.enabled = true,
  });

  final bool value;
  final ValueChanged<bool?>? onChanged;
  final VoidCallback onTermsTap;
  final VoidCallback onPrivacyTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 20,
          width: 20,
          child: Checkbox(
            value: value,
            onChanged: enabled ? onChanged : null,
            activeColor: AuthScreenColors.primaryBlue,
            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            visualDensity: VisualDensity.compact,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
            side: BorderSide(color: Colors.grey.shade400),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: GestureDetector(
            onTap: enabled ? () => onChanged?.call(!value) : null,
            child: Text.rich(
              TextSpan(
                style: TextStyle(fontSize: 12, color: Colors.grey.shade700, height: 1.4),
                children: [
                  const TextSpan(text: 'I agree to the '),
                  WidgetSpan(
                    alignment: PlaceholderAlignment.baseline,
                    baseline: TextBaseline.alphabetic,
                    child: GestureDetector(
                      onTap: enabled ? onTermsTap : null,
                      child: const Text(
                        'Terms & Conditions',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AuthScreenColors.primaryBlue,
                        ),
                      ),
                    ),
                  ),
                  const TextSpan(text: ' and '),
                  WidgetSpan(
                    alignment: PlaceholderAlignment.baseline,
                    baseline: TextBaseline.alphabetic,
                    child: GestureDetector(
                      onTap: enabled ? onPrivacyTap : null,
                      child: const Text(
                        'Privacy Policy',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AuthScreenColors.primaryBlue,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class AuthWavePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AuthScreenColors.primaryBlue.withValues(alpha: 0.06)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    for (var i = 0; i < 3; i++) {
      final path = Path();
      final y = size.height * 0.35 + i * 22.0;
      path.moveTo(0, y);
      for (var x = 0.0; x <= size.width; x += 40) {
        path.quadraticBezierTo(x + 20, y - 10, x + 40, y);
      }
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
