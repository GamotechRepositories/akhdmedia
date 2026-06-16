import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/brand.dart';
import '../../core/theme/app_spacing.dart';
import '../../widgets/common/coming_soon_view.dart';
import '../shell/main_shell.dart';

class ProfileHubScreen extends StatelessWidget {
  const ProfileHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
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
                  const Text(
                    'Welcome',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    Brand.tagline,
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _MenuTile(
            icon: Icons.login_rounded,
            title: 'Login',
            subtitle: 'Phase 3',
            onTap: () => context.push('/login'),
          ),
          _MenuTile(
            icon: Icons.person_add_alt_1_rounded,
            title: 'Register',
            subtitle: 'Phase 3',
            onTap: () => context.push('/register'),
          ),
          _MenuTile(
            icon: Icons.receipt_long_outlined,
            title: 'My orders',
            subtitle: 'Phase 3',
            onTap: () => context.push('/orders'),
          ),
          _MenuTile(
            icon: Icons.support_agent_outlined,
            title: 'Support',
            subtitle: 'Phase 4',
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
        ],
      ),
    );
  }
}

class _MenuTile extends StatelessWidget {
  const _MenuTile({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: ListTile(
        dense: true,
        leading: Icon(icon, size: 20),
        title: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        subtitle: subtitle != null
            ? Text(subtitle!, style: const TextStyle(fontSize: 10))
            : null,
        trailing: const Icon(Icons.chevron_right_rounded, size: 18),
        onTap: onTap,
      ),
    );
  }
}

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: const ComingSoonView(
        title: 'Login',
        phase: 'Phase 3 — Account',
      ),
    );
  }
}

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Register')),
      body: const ComingSoonView(
        title: 'Register',
        phase: 'Phase 3 — Account',
      ),
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: const ComingSoonView(title: 'Profile', phase: 'Phase 3 — Account'),
    );
  }
}

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Orders')),
      body: const ComingSoonView(title: 'Orders', phase: 'Phase 3 — Account'),
    );
  }
}
