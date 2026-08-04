import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ModernBottomBar extends StatefulWidget {
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

  @override
  State<ModernBottomBar> createState() => _ModernBottomBarState();
}

class _ModernBottomBarState extends State<ModernBottomBar> {
  static const double _indicatorSize = 40;

  int? _dragHighlightIndex;
  int? _lastHapticIndex;
  bool _isDragging = false;

  int _branchToDisplayIndex(int branchIndex) {
    return branchIndex.clamp(0, ModernBottomBar._tabs.length - 1);
  }

  int get _displayIndex =>
      _dragHighlightIndex ?? _branchToDisplayIndex(widget.selectedIndex);

  @override
  void didUpdateWidget(covariant ModernBottomBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedIndex != widget.selectedIndex) {
      _dragHighlightIndex = null;
      _lastHapticIndex = _branchToDisplayIndex(widget.selectedIndex);
    }
  }

  void _pickTabFromX(double x, double width, {required bool commit}) {
    final tabCount = ModernBottomBar._tabs.length;
    final index = ((x / width) * tabCount).floor().clamp(0, tabCount - 1);

    if (_dragHighlightIndex != index) {
      setState(() => _dragHighlightIndex = index);
    }

    if (_lastHapticIndex != index) {
      _lastHapticIndex = index;
      HapticFeedback.selectionClick();
    }

    if (!commit) return;
    if (index != widget.selectedIndex) {
      widget.onTabSelected(index);
    }
  }

  void _onTapTab(int index) {
    HapticFeedback.mediumImpact();
    setState(() {
      _dragHighlightIndex = null;
      _lastHapticIndex = index;
    });

    widget.onTabSelected(index);
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.paddingOf(context).bottom;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Padding(
        padding: EdgeInsets.only(bottom: bottomInset),
        child: Material(
          color: Colors.transparent,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              LayoutBuilder(
                builder: (context, constraints) {
                  final width = constraints.maxWidth;
                  final tabWidth = width / ModernBottomBar._tabs.length;

                  return GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onHorizontalDragStart: (_) {
                      _isDragging = true;
                  _lastHapticIndex = _branchToDisplayIndex(widget.selectedIndex);
                    },
                    onHorizontalDragUpdate: (details) {
                      _pickTabFromX(details.localPosition.dx, width, commit: true);
                    },
                    onHorizontalDragEnd: (_) {
                      setState(() {
                        _dragHighlightIndex = null;
                        _isDragging = false;
                      });
                    },
                    onHorizontalDragCancel: () {
                      setState(() {
                        _dragHighlightIndex = null;
                        _isDragging = false;
                      });
                    },
                    child: SizedBox(
                      height: 56,
                      child: Stack(
                        children: [
                          AnimatedPositioned(
                            duration: const Duration(milliseconds: 220),
                            curve: Curves.easeOutCubic,
                            left: tabWidth * _displayIndex + (tabWidth - _indicatorSize) / 2,
                            top: (56 - _indicatorSize) / 2,
                            width: _indicatorSize,
                            height: _indicatorSize,
                            child: const DecoratedBox(
                              decoration: BoxDecoration(
                                color: Color(0xFFEFF6FF),
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                          IgnorePointer(
                            ignoring: _isDragging,
                            child: Row(
                              children: [
                                for (var i = 0; i < ModernBottomBar._tabs.length; i++)
                                  Expanded(
                                    child: Center(
                                      child: _BottomBarItem(
                                        data: ModernBottomBar._tabs[i],
                                        selected: _displayIndex == i,
                                        cartCount: widget.cartCount,
                                        onTap: () => _onTapTab(i),
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
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
    final color = selected ? const Color(0xFF2563EB) : const Color(0xFF94A3B8);

    return Semantics(
      button: true,
      selected: selected,
      label: data.label,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          customBorder: const CircleBorder(),
          splashColor: const Color(0xFF2563EB).withValues(alpha: 0.12),
          highlightColor: const Color(0xFF2563EB).withValues(alpha: 0.08),
          onTap: onTap,
          child: SizedBox(
            width: 44,
            height: 44,
            child: Center(
              child: data.isCart && cartCount > 0
                  ? Badge(
                      label: Text('$cartCount'),
                      backgroundColor: const Color(0xFF2563EB),
                      child: Icon(
                        selected ? data.activeIcon : data.icon,
                        size: 24,
                        color: color,
                      ),
                    )
                  : Icon(
                      selected ? data.activeIcon : data.icon,
                      size: 24,
                      color: color,
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
