import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/constants/brand.dart';
import '../../core/theme/app_spacing.dart';
import '../../providers/auth_provider.dart';
import '../shell/main_shell.dart';

class ProfileHubScreen extends StatelessWidget {
  const ProfileHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: const StoreAppBar(title: 'Account'),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    auth.isAuthenticated ? 'Hello, ${auth.user!.name}' : 'Welcome',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    auth.isAuthenticated ? auth.user!.email : Brand.tagline,
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          if (auth.isAuthenticated) ...[
            _MenuTile(
              icon: Icons.person_outline_rounded,
              title: 'Profile',
              onTap: () => context.push('/profile'),
            ),
            _MenuTile(
              icon: Icons.receipt_long_outlined,
              title: 'My orders',
              onTap: () => context.push('/orders'),
            ),
            _MenuTile(
              icon: Icons.logout_rounded,
              title: 'Sign out',
              onTap: () => context.read<AuthProvider>().logout(),
            ),
          ] else ...[
            _MenuTile(
              icon: Icons.login_rounded,
              title: 'Login',
              onTap: () => context.push('/login'),
            ),
            _MenuTile(
              icon: Icons.person_add_alt_1_rounded,
              title: 'Register',
              onTap: () => context.push('/register'),
            ),
          ],
          _MenuTile(
            icon: Icons.support_agent_outlined,
            title: 'Support',
            onTap: () => context.push('/support'),
          ),
          _MenuTile(
            icon: Icons.info_outline_rounded,
            title: 'About us',
            onTap: () => context.push('/about-us'),
          ),
          _MenuTile(
            icon: Icons.policy_outlined,
            title: 'Privacy policy',
            onTap: () => context.push('/privacy-policy'),
          ),
          _MenuTile(
            icon: Icons.gavel_outlined,
            title: 'Terms & conditions',
            onTap: () => context.push('/terms-and-conditions'),
          ),
          _MenuTile(
            icon: Icons.assignment_return_outlined,
            title: 'Refund policy',
            onTap: () => context.push('/refund-policy'),
          ),
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: ListTile(
        dense: true,
        leading: Icon(icon, size: 20),
        title: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        trailing: const Icon(Icons.chevron_right_rounded, size: 18),
        onTap: onTap,
      ),
    );
  }
}
