import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ModernBottomBar extends StatefulWidget {
  const ModernBottomBar({
    super.key,
    required this.selectedIndex,
    required this.onTabSelected,
    required this.cartCount,
    this.onSearchSubmitted,
  });

  final int selectedIndex;
  final ValueChanged<int> onTabSelected;
  final int cartCount;
  final ValueChanged<String>? onSearchSubmitted;

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
      label: 'Search',
      icon: Icons.search_rounded,
      activeIcon: Icons.search_rounded,
      isSearch: true,
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
    if (branchIndex <= 2) return branchIndex;
    return 4;
  }

  int get _displayIndex =>
      _dragHighlightIndex ?? _branchToDisplayIndex(widget.selectedIndex);

  void _openSearchInput() {
    HapticFeedback.lightImpact();
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      builder: (ctx) => _SearchInputSheet(
        onSubmitted: (query) {
          Navigator.of(ctx).pop();
          widget.onSearchSubmitted?.call(query);
        },
      ),
    );
  }

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
    final tab = ModernBottomBar._tabs[index];

    if (!tab.isSearch && _dragHighlightIndex != index) {
      setState(() => _dragHighlightIndex = index);
    }

    if (_lastHapticIndex != index && !tab.isSearch) {
      _lastHapticIndex = index;
      HapticFeedback.selectionClick();
    }

    if (!commit) return;
    if (tab.isSearch) {
      return;
    }

    final branchIndex = index <= 2 ? index : 3;
    if (branchIndex != widget.selectedIndex) {
      widget.onTabSelected(branchIndex);
    }
  }

  void _onTapTab(int index) {
    final tab = ModernBottomBar._tabs[index];
    if (tab.isSearch) {
      _openSearchInput();
      return;
    }

    HapticFeedback.mediumImpact();
    setState(() {
      _dragHighlightIndex = null;
      _lastHapticIndex = index;
    });

    final branchIndex = index <= 2 ? index : 3;
    widget.onTabSelected(branchIndex);
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

class _SearchInputSheet extends StatefulWidget {
  const _SearchInputSheet({required this.onSubmitted});

  final ValueChanged<String> onSubmitted;

  @override
  State<_SearchInputSheet> createState() => _SearchInputSheetState();
}

class _SearchInputSheetState extends State<_SearchInputSheet> {
  late final TextEditingController _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    final query = _controller.text.trim();
    if (query.isEmpty) return;
    widget.onSubmitted(query);
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        16,
        16,
        16,
        MediaQuery.viewInsetsOf(context).bottom + 16,
      ),
      child: TextField(
        controller: _controller,
        autofocus: true,
        textInputAction: TextInputAction.search,
        decoration: const InputDecoration(
          hintText: 'Search clips, categories...',
          prefixIcon: Icon(Icons.search_rounded),
        ),
        onSubmitted: (_) => _submit(),
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
    this.isSearch = false,
  });

  final String label;
  final IconData icon;
  final IconData activeIcon;
  final bool isCart;
  final bool isSearch;
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
