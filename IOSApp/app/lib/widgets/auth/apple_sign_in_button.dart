import 'package:flutter/material.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

class AppleSignInButton extends StatelessWidget {
  const AppleSignInButton({
    super.key,
    required this.onPressed,
    this.disabled = false,
  });

  final VoidCallback? onPressed;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    return SignInWithAppleButton(
      onPressed: disabled ? null : onPressed,
      style: SignInWithAppleButtonStyle.black,
      borderRadius: BorderRadius.circular(28),
      height: 44,
    );
  }
}
