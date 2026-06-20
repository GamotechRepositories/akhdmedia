import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/constants/site_content.dart';
import '../../core/theme/app_spacing.dart';
import '../../services/order_service.dart';
import '../../services/support_service.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _orderCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();

  String _subject = 'license_email';
  bool _submitting = false;
  String? _error;
  String? _ticket;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _prefill());
  }

  Future<void> _prefill() async {
    final params = GoRouterState.of(context).uri.queryParameters;
    _emailCtrl.text = params['email'] ?? '';
    _orderCtrl.text = params['order'] ?? '';
    _subject = params['subject'] ?? 'license_email';

    try {
      final profile = await context.read<OrderService>().getCheckoutProfile();
      if (profile != null) {
        _nameCtrl.text = profile.name;
        if (_emailCtrl.text.isEmpty) _emailCtrl.text = profile.email;
        _phoneCtrl.text = profile.phone;
      }
    } catch (_) {}

    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _orderCtrl.dispose();
    _messageCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final ticket = await context.read<SupportService>().submitRequest(
            name: _nameCtrl.text.trim(),
            email: _emailCtrl.text.trim(),
            phone: _phoneCtrl.text.trim(),
            orderNumber: _orderCtrl.text.trim(),
            subject: _subject,
            message: _messageCtrl.text.trim(),
          );
      if (mounted) setState(() => _ticket = ticket);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_ticket != null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Support')),
        body: Padding(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.check_circle_rounded, size: 64, color: Color(0xFF059669)),
              const SizedBox(height: AppSpacing.md),
              const Text('Request submitted', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
              const SizedBox(height: AppSpacing.sm),
              Text('Ticket #$_ticket', style: const TextStyle(fontFamily: 'monospace')),
              const SizedBox(height: AppSpacing.lg),
              FilledButton(onPressed: () => context.go('/'), child: const Text('Back to home')),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Support')),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.lg),
        children: [
          Text(
            'How can we help?',
            style: TextStyle(fontSize: 14, color: Colors.grey.shade700),
          ),
          const SizedBox(height: AppSpacing.md),
          TextField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email'),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _phoneCtrl,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Phone (optional)'),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _orderCtrl,
            decoration: const InputDecoration(labelText: 'Order number (optional)'),
          ),
          const SizedBox(height: AppSpacing.sm),
          DropdownButtonFormField<String>(
            value: _subject,
            decoration: const InputDecoration(labelText: 'Subject'),
            items: SiteContent.supportSubjects
                .map((s) => DropdownMenuItem(value: s.$1, child: Text(s.$2, style: const TextStyle(fontSize: 13))))
                .toList(),
            onChanged: (v) => setState(() => _subject = v ?? 'other'),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _messageCtrl,
            maxLines: 5,
            decoration: const InputDecoration(
              labelText: 'Message',
              alignLabelWithHint: true,
            ),
          ),
          if (_error != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12)),
          ],
          const SizedBox(height: AppSpacing.lg),
          FilledButton(
            onPressed: _submitting ? null : _submit,
            child: Text(_submitting ? 'Submitting…' : 'Submit request'),
          ),
        ],
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
