import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/site_content.dart';
import '../../core/theme/app_spacing.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('About us')),
      body: _ContentScroll(sections: SiteContent.aboutSections),
    );
  }
}

class PolicyScreen extends StatelessWidget {
  const PolicyScreen({super.key, required this.title, this.policySlug});

  final String title;
  final String? policySlug;

  @override
  Widget build(BuildContext context) {
    final slug = policySlug ?? SiteContent.policySlugFromPath(GoRouterState.of(context).uri.path);
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: _ContentScroll(sections: SiteContent.policySections(slug)),
    );
  }
}

class _ContentScroll extends StatelessWidget {
  const _ContentScroll({required this.sections});

  final List<ContentSection> sections;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        for (final section in sections) ...[
          if (section.title.isNotEmpty)
            Text(section.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          for (final paragraph in section.paragraphs) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(paragraph, style: TextStyle(fontSize: 13, height: 1.45, color: Colors.grey.shade800)),
          ],
          if (section.bullets.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            ...section.bullets.map(
              (b) => Padding(
                padding: const EdgeInsets.only(left: 8, bottom: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('•  '),
                    Expanded(child: Text(b, style: TextStyle(fontSize: 13, color: Colors.grey.shade800))),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.lg),
        ],
      ],
    );
  }
}
