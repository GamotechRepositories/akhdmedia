import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_spacing.dart';

class PoliciesLegalScreen extends StatelessWidget {
  const PoliciesLegalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('Policies & Legal'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg,
          AppSpacing.md,
          AppSpacing.lg,
          AppSpacing.lg,
        ),
        children: const [
          _PolicyTile(
            title: 'Privacy Policy',
            subtitle: 'How we collect and protect your data',
            route: '/privacy-policy',
            icon: Icons.privacy_tip_outlined,
          ),
          _PolicyTile(
            title: 'Terms & Conditions',
            subtitle: 'Website usage and purchase terms',
            route: '/terms-and-conditions',
            icon: Icons.gavel_outlined,
          ),
          _PolicyTile(
            title: 'Refund Policy',
            subtitle: 'Digital product refund terms and exceptions',
            route: '/refund-policy',
            icon: Icons.receipt_long_outlined,
          ),
          _PolicyTile(
            title: 'License Information Policy',
            subtitle: 'Content licensing rights and restrictions',
            route: '/license-information-policy',
            icon: Icons.verified_user_outlined,
          ),
          _PolicyTile(
            title: 'Editorial Policy',
            subtitle: 'Editorial and personal-use guidelines',
            route: '/editorial-policy',
            icon: Icons.article_outlined,
          ),
          _PolicyTile(
            title: 'Legal Policy',
            subtitle: 'Legal terms, ownership, and compliance',
            route: '/legal-policy',
            icon: Icons.balance_outlined,
          ),
          _PolicyTile(
            title: 'Media Accreditation & Editorial Coverage Policy',
            subtitle: 'Editorial event coverage and accreditation',
            route: '/media-accreditation-policy',
            icon: Icons.badge_outlined,
          ),
        ],
      ),
    );
  }
}

class _PolicyTile extends StatelessWidget {
  const _PolicyTile({
    required this.title,
    required this.subtitle,
    required this.route,
    required this.icon,
  });

  final String title;
  final String subtitle;
  final String route;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => context.push(route),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, color: const Color(0xFF2563EB), size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        subtitle,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: Color(0xFFCBD5E1),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
