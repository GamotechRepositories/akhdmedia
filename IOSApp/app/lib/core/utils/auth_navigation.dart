import 'package:go_router/go_router.dart';

/// Navigate after a successful login or registration.
void completeAuthNavigation(
  GoRouter router, {
  String? redirectTo,
}) {
  final target = redirectTo?.trim();
  if (target != null && target.isNotEmpty) {
    router.go(target);
    return;
  }
  router.go('/account');
}
