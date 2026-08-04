import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';

/// Redirects to login when cart/checkout actions require authentication.
Future<bool> ensureAuthenticated(
  BuildContext context, {
  String? redirectTo,
}) async {
  final auth = context.read<AuthProvider>();
  if (auth.isAuthenticated) return true;

  final path = redirectTo ?? GoRouterState.of(context).uri.toString();
  final result = await context.push<bool>('/login?redirect=${Uri.encodeComponent(path)}');
  final authed = result == true || context.read<AuthProvider>().isAuthenticated;
  if (authed) {
    await context.read<CartProvider>().loadCart();
  }
  return authed;
}
