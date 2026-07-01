import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/cart_provider.dart';
import 'modern_bottom_bar.dart';

/// Tracks the last selected shell tab for routes outside [MainShell].
class ShellTabState {
  ShellTabState._();

  static int lastTabIndex = 0;

  static void noteTabIndex(int index) {
    lastTabIndex = index.clamp(0, 3);
  }
}

class ShellBottomBar extends StatelessWidget {
  const ShellBottomBar({
    super.key,
    this.selectedIndex,
    this.onTabSelected,
    this.onSearchSubmitted,
  });

  final int? selectedIndex;
  final ValueChanged<int>? onTabSelected;
  final ValueChanged<String>? onSearchSubmitted;

  static const _tabRoutes = ['/', '/videos', '/cart', '/account'];

  void _defaultSelectTab(BuildContext context, int index) {
    ShellTabState.noteTabIndex(index);
    context.go(_tabRoutes[index]);
  }

  void _defaultSearch(BuildContext context, String query) {
    context.go('/videos?search=${Uri.encodeComponent(query)}');
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<CartProvider>(
      builder: (context, cart, _) {
        return ModernBottomBar(
          selectedIndex: selectedIndex ?? ShellTabState.lastTabIndex,
          cartCount: cart.cart.itemCount,
          onTabSelected: (index) =>
              (onTabSelected ?? (i) => _defaultSelectTab(context, i))(index),
          onSearchSubmitted: (query) =>
              (onSearchSubmitted ?? (q) => _defaultSearch(context, q))(query),
        );
      },
    );
  }
}

/// Bottom inset to keep scroll content above the shell bottom bar.
double shellBottomBarInset(BuildContext context) {
  return 56 + MediaQuery.paddingOf(context).bottom;
}
