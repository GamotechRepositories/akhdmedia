import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/brand.dart';
import '../../core/theme/app_spacing.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  void _onTap(int index) {
    widget.navigationShell.goBranch(
      index,
      initialLocation: index == widget.navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.navigationShell,
      bottomNavigationBar: NavigationBar(
        height: 60,
        selectedIndex: widget.navigationShell.currentIndex,
        onDestinationSelected: _onTap,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.video_library_outlined),
            selectedIcon: Icon(Icons.video_library_rounded),
            label: 'Videos',
          ),
          NavigationDestination(
            icon: Icon(Icons.shopping_cart_outlined),
            selectedIcon: Icon(Icons.shopping_cart_rounded),
            label: 'Cart',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline_rounded),
            selectedIcon: Icon(Icons.person_rounded),
            label: 'Account',
          ),
        ],
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
      builder: (ctx) {
        final controller = TextEditingController();
        return Padding(
          padding: EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.lg,
            MediaQuery.viewInsetsOf(ctx).bottom + AppSpacing.lg,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextField(
                controller: controller,
                autofocus: true,
                decoration: const InputDecoration(
                  hintText: 'Search clips, categories...',
                  prefixIcon: Icon(Icons.search),
                ),
                onSubmitted: (value) {
                  Navigator.pop(ctx);
                  context.go('/videos?search=${Uri.encodeComponent(value.trim())}');
                },
              ),
            ],
          ),
        );
      },
    );
  }
}
