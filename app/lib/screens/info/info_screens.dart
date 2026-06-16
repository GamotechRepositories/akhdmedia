import 'package:flutter/material.dart';

import '../../widgets/common/coming_soon_view.dart';

class SupportScreen extends StatelessWidget {
  const SupportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Support')),
      body: const ComingSoonView(
        title: 'Support',
        phase: 'Phase 4 — Info',
        description: 'Contact form mirroring the web /support page.',
      ),
    );
  }
}

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('About us')),
      body: const ComingSoonView(title: 'About us', phase: 'Phase 4 — Info'),
    );
  }
}

class PolicyScreen extends StatelessWidget {
  const PolicyScreen({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: ComingSoonView(title: title, phase: 'Phase 4 — Info'),
    );
  }
}
