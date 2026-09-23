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
      label: 'Browse',
      icon: Icons.play_circle_outline_rounded,
      activeIcon: Icons.play_circle_rounded,
    ),
    _TabData(
      label: 'Bag',
      icon: Icons.shopping_bag_outlined,
      activeIcon: Icons.shopping_bag_rounded,
      isCart: true,
    ),
    _TabData(
      label: 'Account',
      icon: Icons.person_outline_rounded,
      activeIcon: Icons.person_rounded,
    ),
  ];

  static const _barHeight = 62.0;
  static const _horizontalInset = 18.0;
  static const _bottomMargin = 10.0;

  static double totalHeight(BuildContext context) {
    return _barHeight + _bottomMargin + MediaQuery.paddingOf(context).bottom;
  }

  void _onTap(int index) {
    HapticFeedback.lightImpact();
    onTabSelected(index);
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;
    final activeIndex = selectedIndex.clamp(0, _tabs.length - 1);

    return Padding(
      padding: EdgeInsets.fromLTRB(
        _horizontalInset,
        0,
        _horizontalInset,
        bottomInset + _bottomMargin,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(31),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: const Color(0xFFF2F2F7).withValues(alpha: 0.88),
              borderRadius: BorderRadius.circular(31),
              border: Border.all(
                color: Colors.white.withValues(alpha: 0.65),
                width: 0.6,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.10),
                  blurRadius: 28,
                  offset: const Offset(0, 10),
                ),
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: SizedBox(
              height: _barHeight,
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final tabWidth = constraints.maxWidth / _tabs.length;

                  return Stack(
                    clipBehavior: Clip.none,
                    children: [
                      AnimatedPositioned(
                        duration: const Duration(milliseconds: 280),
                        curve: Curves.easeOutCubic,
                        left: tabWidth * activeIndex + 6,
                        top: 6,
                        width: tabWidth - 12,
                        height: _barHeight - 12,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.95),
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.06),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Row(
                        children: [
                          for (var i = 0; i < _tabs.length; i++)
                            Expanded(
                              child: _BottomBarItem(
                                data: _tabs[i],
                                selected: activeIndex == i,
                                cartCount: cartCount,
                                onTap: () => _onTap(i),
                              ),
                            ),
                        ],
                      ),
                    ],
                  );
                },
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

  @override
  Widget build(BuildContext context) {
    const activeColor = Color(0xFF111827);
    const inactiveColor = Color(0xFF8E8E93);

    return Semantics(
      button: true,
      selected: selected,
      label: data.label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(24),
          splashColor: activeColor.withValues(alpha: 0.08),
          highlightColor: activeColor.withValues(alpha: 0.04),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _TabIcon(
                  data: data,
                  selected: selected,
                  cartCount: cartCount,
                  activeColor: activeColor,
                  inactiveColor: inactiveColor,
                ),
                const SizedBox(height: 2),
                AnimatedDefaultTextStyle(
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeOut,
                  style: TextStyle(
                    fontSize: 10,
                    height: 1.1,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                    letterSpacing: -0.1,
                    color: selected ? activeColor : inactiveColor,
                  ),
                  child: Text(data.label),
                ),
              ],
            ),
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
    required this.activeColor,
    required this.inactiveColor,
  });

  final _TabData data;
  final bool selected;
  final int cartCount;
  final Color activeColor;
  final Color inactiveColor;

  @override
  Widget build(BuildContext context) {
    final icon = Icon(
      selected ? data.activeIcon : data.icon,
      size: 22,
      color: selected ? activeColor : inactiveColor,
    );

    if (!data.isCart || cartCount <= 0) {
      return icon;
    }

    return Badge(
      isLabelVisible: cartCount > 0,
      label: Text(
        cartCount > 99 ? '99+' : '$cartCount',
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          height: 1,
        ),
      ),
      backgroundColor: const Color(0xFF2563EB),
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      offset: const Offset(8, -6),
      child: icon,
    );
  }
}
