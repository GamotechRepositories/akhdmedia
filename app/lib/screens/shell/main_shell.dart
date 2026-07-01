import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/brand.dart';
import '../../core/theme/app_spacing.dart';
import '../../widgets/shell/shell_bottom_bar.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _trackedTabIndex = 0;
  int _previousTabIndex = 0;
  DateTime? _lastBackPressAt;
  bool _handlingBackNavigation = false;

  void _noteTabIndex(int currentIndex) {
    ShellTabState.noteTabIndex(currentIndex);
    if (_handlingBackNavigation) return;
    if (currentIndex != _trackedTabIndex) {
      _previousTabIndex = _trackedTabIndex;
      _trackedTabIndex = currentIndex;
    }
  }

  void _selectTab(int index) {
    _noteTabIndex(widget.navigationShell.currentIndex);
    ShellTabState.noteTabIndex(index);
    widget.navigationShell.goBranch(
      index,
      initialLocation: index == widget.navigationShell.currentIndex,
    );
  }

  void _goToPreviousTab() {
    final shell = widget.navigationShell;
    var target = _previousTabIndex.clamp(0, 3);

    // Avoid looping on the same tab when history is stale.
    if (target == shell.currentIndex) {
      target = 0;
    }

    _handlingBackNavigation = true;
    shell.goBranch(target, initialLocation: true);
    _trackedTabIndex = target;
    ShellTabState.noteTabIndex(target);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _handlingBackNavigation = false;
    });
  }

  bool _isShellTabPath(String path) {
    return path == '/' ||
        path == '/videos' ||
        path == '/cart' ||
        path == '/account';
  }

  @override
  Widget build(BuildContext context) {
    final shell = widget.navigationShell;
    _noteTabIndex(shell.currentIndex);
    final onHomeTab = shell.currentIndex == 0;
    final currentPath = GoRouterState.of(context).uri.path;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;

        final navigator = Navigator.of(context, rootNavigator: true);
        if (navigator.canPop() && !_isShellTabPath(currentPath)) {
          navigator.pop();
          return;
        }

        if (!onHomeTab) {
          _goToPreviousTab();
          return;
        }

        final now = DateTime.now();
        final lastPress = _lastBackPressAt;
        if (lastPress == null ||
            now.difference(lastPress) > const Duration(seconds: 2)) {
          _lastBackPressAt = now;
          ScaffoldMessenger.of(context)
            ..hideCurrentSnackBar()
            ..showSnackBar(
              const SnackBar(
                content: Text('Tap again to exit'),
                duration: Duration(seconds: 2),
              ),
            );
          return;
        }

        SystemNavigator.pop();
      },
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        body: shell,
        bottomNavigationBar: ShellBottomBar(
          selectedIndex: shell.currentIndex,
          onTabSelected: _selectTab,
        ),
      ),
    );
  }
}

/// Top app bar used on tab roots.
class StoreAppBar extends StatelessWidget implements PreferredSizeWidget {
  const StoreAppBar({
    super.key,
    this.title,
    this.showSearch = false,
    this.onSearch,
  });

  final String? title;
  final bool showSearch;
  final ValueChanged<String>? onSearch;

  @override
  Size get preferredSize => const Size.fromHeight(52);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title ?? Brand.name),
      actions: [
        if (showSearch)
          IconButton(
            icon: const Icon(Icons.search_rounded, size: 22),
            onPressed: () => _openSearch(context),
          ),
        IconButton(
          icon: const Icon(Icons.support_agent_outlined, size: 22),
          onPressed: () => context.push('/support'),
        ),
      ],
    );
  }

  void _openSearch(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      builder: (ctx) => _StoreSearchSheet(
        onSubmitted: (query) {
          Navigator.pop(ctx);
          context.go('/videos?search=${Uri.encodeComponent(query)}');
        },
      ),
    );
  }
}

class _StoreSearchSheet extends StatefulWidget {
  const _StoreSearchSheet({required this.onSubmitted});

  final ValueChanged<String> onSubmitted;

  @override
  State<_StoreSearchSheet> createState() => _StoreSearchSheetState();
}

class _StoreSearchSheetState extends State<_StoreSearchSheet> {
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
        AppSpacing.lg,
        AppSpacing.lg,
        AppSpacing.lg,
        MediaQuery.viewInsetsOf(context).bottom + AppSpacing.lg,
      ),
      child: TextField(
        controller: _controller,
        autofocus: true,
        decoration: const InputDecoration(
          hintText: 'Search clips, categories...',
          prefixIcon: Icon(Icons.search),
        ),
        onSubmitted: (_) => _submit(),
      ),
    );
  }
}
