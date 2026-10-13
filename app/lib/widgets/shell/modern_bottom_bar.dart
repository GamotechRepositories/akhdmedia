import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ModernBottomBar extends StatelessWidget {
  const ModernBottomBar({
    super.key,
    required this.selectedIndex,
    required this.onTabSelected,
    required this.cartCount,
  });

  final int selectedIndex;
  final ValueChanged<int> onTabSelected;
  final int cartCount;

  static const _tabs = [
    _TabData(
      label: 'Home',
      icon: Icons.home_outlined,
      activeIcon: Icons.home_rounded,
    ),
    _TabData(
      label: 'Videos',
      icon: Icons.video_library_outlined,
      activeIcon: Icons.video_library_rounded,
    ),
    _TabData(
      label: 'Cart',
      icon: Icons.shopping_cart_outlined,
      activeIcon: Icons.shopping_cart_rounded,
      isCart: true,
    ),
    _TabData(
      label: 'Profile',
      icon: Icons.person_outline_rounded,
      activeIcon: Icons.person_rounded,
    ),
  ];

  static const _barHeight = 64.0;
  static const _horizontalMargin = 20.0;
  static const _minBottomMargin = 12.0;

  static double _bottomMargin(BuildContext context) {
    final safeBottom = MediaQuery.paddingOf(context).bottom;
    return safeBottom > 0 ? safeBottom : _minBottomMargin;
  }

  /// Vertical space the floating bar occupies, including the bottom safe area.
  static double totalHeight(BuildContext context) {
    return _barHeight + _bottomMargin(context);
  }

  void _onTap(int index) {
    HapticFeedback.selectionClick();
    onTabSelected(index);
  }

  @override
  Widget build(BuildContext context) {
    final activeIndex = selectedIndex.clamp(0, _tabs.length - 1);

    return Padding(
      padding: EdgeInsets.fromLTRB(
        _horizontalMargin,
        0,
        _horizontalMargin,
        _bottomMargin(context),
      ),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(_barHeight / 2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.12),
              blurRadius: 30,
              offset: const Offset(0, 10),
            ),
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(_barHeight / 2),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
            child: Container(
              height: _barHeight,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.82),
                borderRadius: BorderRadius.circular(_barHeight / 2),
                border: Border.all(
                  color: Colors.white.withValues(alpha: 0.7),
                  width: 0.8,
                ),
              ),
              child: Material(
                type: MaterialType.transparency,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    for (var i = 0; i < _tabs.length; i++)
                      _BottomBarItem(
                        data: _tabs[i],
                        selected: activeIndex == i,
                        cartCount: cartCount,
                        onTap: () => _onTap(i),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _TabData {
  const _TabData({
    required this.label,
    required this.icon,
    required this.activeIcon,
    this.isCart = false,
  });

  final String label;
  final IconData icon;
  final IconData activeIcon;
  final bool isCart;
}

class _BottomBarItem extends StatelessWidget {
  const _BottomBarItem({
    required this.data,
    required this.selected,
    required this.cartCount,
    required this.onTap,
  });

  final _TabData data;
  final bool selected;
  final int cartCount;
  final VoidCallback onTap;

  static const _activeColor = Color(0xFF000000);
  static const _inactiveColor = Color(0xFF8E8E93);
  static const _duration = Duration(milliseconds: 280);

  @override
  Widget build(BuildContext context) {
    final color = selected ? _activeColor : _inactiveColor;

    return Semantics(
      button: true,
      selected: selected,
      label: data.label,
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        splashColor: _activeColor.withValues(alpha: 0.10),
        highlightColor: _activeColor.withValues(alpha: 0.05),
        child: AnimatedContainer(
          duration: _duration,
          curve: Curves.easeOutCubic,
          height: 48,
          constraints: const BoxConstraints(minWidth: 48),
          padding: EdgeInsets.symmetric(horizontal: selected ? 16 : 12),
          decoration: BoxDecoration(
            color: selected
                ? _activeColor.withValues(alpha: 0.08)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(24),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _TabIcon(
                data: data,
                selected: selected,
                cartCount: cartCount,
                color: color,
              ),
              AnimatedSize(
                duration: _duration,
                curve: Curves.easeOutCubic,
                child: selected
                    ? Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: Text(
                          data.label,
                          maxLines: 1,
                          softWrap: false,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -0.2,
                            color: _activeColor,
                          ),
                        ),
                      )
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TabIcon extends StatelessWidget {
  const _TabIcon({
    required this.data,
    required this.selected,
    required this.cartCount,
    required this.color,
  });

  final _TabData data;
  final bool selected;
  final int cartCount;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final icon = Icon(
      selected ? data.activeIcon : data.icon,
      size: 24,
      color: color,
    );

    if (!data.isCart || cartCount <= 0) {
      return icon;
    }

    return Badge(
      label: Text(
        cartCount > 99 ? '99+' : '$cartCount',
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          height: 1,
        ),
      ),
      backgroundColor: const Color(0xFFEF4444),
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      offset: const Offset(8, -6),
      child: icon,
    );
  }
}
