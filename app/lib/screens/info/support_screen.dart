import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/brand.dart';
import '../../core/constants/site_content.dart';
import '../../services/order_service.dart';
import '../../services/support_service.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  final _searchCtrl = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final params = GoRouterState.of(context).uri.queryParameters;
      if (params.containsKey('email') ||
          params.containsKey('message') ||
          params.containsKey('order')) {
        _openContactSheet(
          subject: params['subject'],
          messageHint: params['message'],
        );
      }
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<_QuickHelpItem> get _quickHelpItems => [
        _QuickHelpItem(
          icon: Icons.menu_book_outlined,
          title: 'Help Center',
          description: 'Find answers to common questions',
          keywords: 'help center about policies',
          onTap: (context) => context.push('/about-us'),
        ),
        _QuickHelpItem(
          icon: Icons.forum_outlined,
          title: 'FAQs',
          description: 'Browse frequently asked questions',
          keywords: 'faq refund license payment',
          onTap: (context) => context.push('/refund-policy'),
        ),
        _QuickHelpItem(
          icon: Icons.description_outlined,
          title: 'Guides',
          description: 'Step-by-step guides & tutorials',
          keywords: 'guides license editorial terms',
          onTap: (context) => context.push('/license-information-policy'),
        ),
        _QuickHelpItem(
          icon: Icons.play_circle_outline_rounded,
          title: 'Video Support',
          description: 'Watch helpful video tutorials',
          keywords: 'video browse catalog footage',
          onTap: (context) => context.go('/videos'),
        ),
      ];

  List<_QuickHelpItem> get _filteredQuickHelp {
    final q = _searchQuery.trim().toLowerCase();
    if (q.isEmpty) return _quickHelpItems;
    return _quickHelpItems
        .where((item) =>
            item.title.toLowerCase().contains(q) ||
            item.description.toLowerCase().contains(q) ||
            item.keywords.toLowerCase().contains(q))
        .toList();
  }

  Future<void> _openContactSheet({String? subject, String? messageHint}) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _SupportContactSheet(
        initialSubject: subject,
        initialMessage: messageHint,
      ),
    );
  }

  Future<void> _launchEmail() async {
    final uri = Uri(
      scheme: 'mailto',
      path: Brand.supportEmail,
      queryParameters: {'subject': 'AKHD Media Support Request'},
    );
    if (!await launchUrl(uri)) {
      if (mounted) await _openContactSheet();
    }
  }

  Future<void> _launchPhone() async {
    final uri = Uri(scheme: 'tel', path: Brand.supportPhone);
    if (!await launchUrl(uri)) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Call us at ${Brand.supportPhone}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          children: [
            _SupportHeader(onBack: () => context.pop()),
            const SizedBox(height: 16),
            _SupportHeroBanner(
              searchController: _searchCtrl,
              onSearchChanged: (value) => setState(() => _searchQuery = value),
            ),
            const SizedBox(height: 22),
            const _SectionTitle('Quick Help'),
            const SizedBox(height: 12),
            if (_filteredQuickHelp.isEmpty)
              _EmptySearchState(query: _searchQuery)
            else
              SizedBox(
                height: 148,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _filteredQuickHelp.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (context, index) {
                    return SizedBox(
                      width: 132,
                      child: _QuickHelpCard(item: _filteredQuickHelp[index]),
                    );
                  },
                ),
              ),
            const SizedBox(height: 22),
            const _SectionTitle('Contact Us'),
            const SizedBox(height: 12),
            _ContactCard(
              children: [
                _ContactRow(
                  icon: Icons.chat_bubble_outline_rounded,
                  title: 'Live Chat',
                  subtitle: 'Chat with our support team in real-time',
                  statusLabel: 'Online',
                  statusColor: const Color(0xFF22C55E),
                  actionLabel: 'Start Chat',
                  onTap: () => _openContactSheet(
                    subject: 'other',
                    messageHint: 'Hi, I need help with...',
                  ),
                ),
                _ContactRow(
                  icon: Icons.mail_outline_rounded,
                  title: 'Email Support',
                  subtitle: "Send us an email and we'll reply ASAP",
                  actionLabel: 'Send Email',
                  onTap: _launchEmail,
                ),
                _ContactRow(
                  icon: Icons.phone_outlined,
                  title: 'Call Support',
                  subtitle: 'Mon - Sat, 9:00 AM - 6:00 PM',
                  actionLabel: 'Call Now',
                  onTap: _launchPhone,
                  showDivider: false,
                ),
              ],
            ),
            const SizedBox(height: 22),
            const _SectionTitle('Policies & Legal'),
            const SizedBox(height: 12),
            _ContactCard(
              children: [
                _ContactRow(
                  icon: Icons.privacy_tip_outlined,
                  title: 'Privacy Policy',
                  subtitle: 'How we collect and protect your data',
                  showAction: false,
                  showChevron: true,
                  onTap: () => context.push('/privacy-policy'),
                ),
                _ContactRow(
                  icon: Icons.receipt_long_outlined,
                  title: 'Refund Policy',
                  subtitle: 'Digital product refund terms and exceptions',
                  showAction: false,
                  showChevron: true,
                  onTap: () => context.push('/refund-policy'),
                ),
                _ContactRow(
                  icon: Icons.gavel_outlined,
                  title: 'Terms & Conditions',
                  subtitle: 'Website usage and purchase terms',
                  showAction: false,
                  showChevron: true,
                  onTap: () => context.push('/terms-and-conditions'),
                ),
                _ContactRow(
                  icon: Icons.verified_user_outlined,
                  title: 'License Information Policy',
                  subtitle: 'Content licensing rights and restrictions',
                  showAction: false,
                  showChevron: true,
                  onTap: () => context.push('/license-information-policy'),
                ),
                _ContactRow(
                  icon: Icons.article_outlined,
                  title: 'Editorial Policy',
                  subtitle: 'Editorial and personal-use guidelines',
                  showAction: false,
                  showChevron: true,
                  showDivider: false,
                  onTap: () => context.push('/editorial-policy'),
                ),
              ],
            ),
            const SizedBox(height: 22),
            Row(
              children: [
                const Expanded(child: _SectionTitle('Your Support Activity')),
                TextButton(
                  onPressed: () => _openContactSheet(),
                  child: const Text(
                    'View All',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF2563EB),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            _ContactCard(
              children: [
                _ContactRow(
                  icon: Icons.confirmation_number_outlined,
                  title: 'My Tickets',
                  subtitle: 'Track your support requests and their status',
                  actionLabel: '',
                  showAction: false,
                  showChevron: true,
                  onTap: () => _openContactSheet(),
                  showDivider: false,
                ),
              ],
            ),
            const SizedBox(height: 20),
            const _ExperienceBanner(),
          ],
        ),
      ),
    );
  }
}

class _SupportHeader extends StatelessWidget {
  const _SupportHeader({required this.onBack});

  final VoidCallback onBack;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        IconButton(
          onPressed: onBack,
          style: IconButton.styleFrom(
            backgroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Color(0xFF64748B)),
        ),
        const Expanded(
          child: Column(
            children: [
              Text(
                'Support',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
              ),
              SizedBox(height: 2),
              Text(
                "We're here to help you",
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
            ],
          ),
        ),
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: const Color(0xFFEFF6FF),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.headset_mic_outlined, color: Color(0xFF2563EB)),
        ),
      ],
    );
  }
}

class _SupportHeroBanner extends StatelessWidget {
  const _SupportHeroBanner({
    required this.searchController,
    required this.onSearchChanged,
  });

  final TextEditingController searchController;
  final ValueChanged<String> onSearchChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(22),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1D4ED8), Color(0xFF2563EB), Color(0xFF3B82F6)],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2563EB).withValues(alpha: 0.25),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.asset('assets/IMG_1577.jpg', width: 48, height: 48, fit: BoxFit.cover),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Hi, how can we help you?',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Search for answers, browse help topics or contact our support team.',
                      style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.35),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            height: 46,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(28),
            ),
            child: TextField(
              controller: searchController,
              onChanged: onSearchChanged,
              style: const TextStyle(fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search for help articles...',
                hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF2563EB), size: 22),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickHelpItem {
  const _QuickHelpItem({
    required this.icon,
    required this.title,
    required this.description,
    required this.keywords,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String description;
  final String keywords;
  final void Function(BuildContext context) onTap;
}

class _QuickHelpCard extends StatelessWidget {
  const _QuickHelpCard({required this.item});

  final _QuickHelpItem item;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: () => item.onTap(context),
        borderRadius: BorderRadius.circular(16),
        child: Container(
          height: 148,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(item.icon, color: const Color(0xFF2563EB), size: 20),
              ),
              const Spacer(),
              Text(
                item.title,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 4),
              Text(
                item.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8), height: 1.3),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
    );
  }
}

class _ContactCard extends StatelessWidget {
  const _ContactCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(children: children),
    );
  }
}

class _ContactRow extends StatelessWidget {
  const _ContactRow({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.statusLabel,
    this.statusColor,
    this.actionLabel = '',
    this.showAction = true,
    this.showChevron = false,
    this.showDivider = true,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final String? statusLabel;
  final Color? statusColor;
  final String actionLabel;
  final bool showAction;
  final bool showChevron;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              child: Row(
                children: [
                  Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: const Color(0xFF2563EB), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              title,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                            if (statusLabel != null) ...[
                              const SizedBox(width: 6),
                              Container(
                                width: 7,
                                height: 7,
                                decoration: BoxDecoration(
                                  color: statusColor ?? Colors.green,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                statusLabel!,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: statusColor ?? Colors.green,
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                        ),
                      ],
                    ),
                  ),
                  if (showAction && actionLabel.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFEFF6FF),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            actionLabel,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF2563EB),
                            ),
                          ),
                          const SizedBox(width: 2),
                          const Icon(Icons.chevron_right_rounded, size: 14, color: Color(0xFF2563EB)),
                        ],
                      ),
                    ),
                  if (showChevron)
                    const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1)),
                ],
              ),
            ),
          ),
        ),
        if (showDivider) Divider(height: 1, color: Colors.grey.shade100, indent: 70),
      ],
    );
  }
}

class _ExperienceBanner extends StatelessWidget {
  const _ExperienceBanner();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFBFDBFE)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.verified_user_outlined, color: Color(0xFF2563EB)),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'We care about your experience',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                ),
                SizedBox(height: 4),
                Text(
                  'Our team is committed to providing you with the best support possible.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.35),
                ),
              ],
            ),
          ),
          const Icon(Icons.headset_mic_outlined, color: Color(0xFF93C5FD), size: 36),
        ],
      ),
    );
  }
}

class _EmptySearchState extends StatelessWidget {
  const _EmptySearchState({required this.query});

  final String query;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Text(
        'No help topics match "$query".',
        textAlign: TextAlign.center,
        style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
      ),
    );
  }
}

class _SupportContactSheet extends StatefulWidget {
  const _SupportContactSheet({this.initialSubject, this.initialMessage});

  final String? initialSubject;
  final String? initialMessage;

  @override
  State<_SupportContactSheet> createState() => _SupportContactSheetState();
}

class _SupportContactSheetState extends State<_SupportContactSheet> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _orderCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();

  late String _subject;
  bool _submitting = false;
  String? _error;
  String? _ticket;

  @override
  void initState() {
    super.initState();
    _subject = widget.initialSubject ?? 'license_email';
    if (widget.initialMessage != null) {
      _messageCtrl.text = widget.initialMessage!;
    }
    WidgetsBinding.instance.addPostFrameCallback((_) => _prefill());
  }

  Future<void> _prefill() async {
    final params = GoRouterState.of(context).uri.queryParameters;
    _emailCtrl.text = params['email'] ?? _emailCtrl.text;
    _orderCtrl.text = params['order'] ?? _orderCtrl.text;
    if (params['subject'] != null) _subject = params['subject']!;
    if (params['message'] != null) _messageCtrl.text = params['message']!;

    try {
      final profile = await context.read<OrderService>().getCheckoutProfile();
      if (profile != null) {
        if (_nameCtrl.text.isEmpty) _nameCtrl.text = profile.name;
        if (_emailCtrl.text.isEmpty) _emailCtrl.text = profile.email;
        if (_phoneCtrl.text.isEmpty) _phoneCtrl.text = profile.phone;
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
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return Container(
      margin: const EdgeInsets.only(top: 48),
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, 12, 20, bottomInset + 20),
        child: _ticket != null ? _buildSuccess() : _buildForm(),
      ),
    );
  }

  Widget _buildSuccess() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 40,
          height: 4,
          decoration: BoxDecoration(
            color: Colors.grey.shade300,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 24),
        const Icon(Icons.check_circle_rounded, size: 56, color: Color(0xFF16A34A)),
        const SizedBox(height: 12),
        const Text('Request submitted', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        Text('Ticket #$_ticket', style: const TextStyle(fontFamily: 'monospace', color: Color(0xFF64748B))),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: FilledButton(
            onPressed: () => Navigator.pop(context),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF2563EB),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: const Text('Done'),
          ),
        ),
      ],
    );
  }

  Widget _buildForm() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'Contact Support',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
          ),
          const SizedBox(height: 4),
          const Text(
            'Fill in the details and our team will get back to you.',
            style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
          ),
          const SizedBox(height: 16),
          _FormField(label: 'Name', controller: _nameCtrl),
          const SizedBox(height: 10),
          _FormField(label: 'Email', controller: _emailCtrl, keyboardType: TextInputType.emailAddress),
          const SizedBox(height: 10),
          _FormField(label: 'Phone (optional)', controller: _phoneCtrl, keyboardType: TextInputType.phone),
          const SizedBox(height: 10),
          _FormField(label: 'Order number (optional)', controller: _orderCtrl),
          const SizedBox(height: 10),
          DropdownButtonFormField<String>(
            value: _subject,
            decoration: _inputDecoration('Subject'),
            items: SiteContent.supportSubjects
                .map((s) => DropdownMenuItem(value: s.$1, child: Text(s.$2, style: const TextStyle(fontSize: 13))))
                .toList(),
            onChanged: _submitting ? null : (v) => setState(() => _subject = v ?? 'other'),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _messageCtrl,
            maxLines: 4,
            decoration: _inputDecoration('Message').copyWith(alignLabelWithHint: true),
          ),
          if (_error != null) ...[
            const SizedBox(height: 10),
            Text(_error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12)),
          ],
          const SizedBox(height: 16),
          SizedBox(
            height: 48,
            child: FilledButton(
              onPressed: _submitting ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: Text(_submitting ? 'Submitting…' : 'Submit Request'),
            ),
          ),
        ],
      ),
    );
  }
}

class _FormField extends StatelessWidget {
  const _FormField({
    required this.label,
    required this.controller,
    this.keyboardType,
  });

  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: _inputDecoration(label),
    );
  }
}

InputDecoration _inputDecoration(String label) {
  return InputDecoration(
    labelText: label,
    filled: true,
    fillColor: Colors.white,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(color: Colors.grey.shade200),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: const BorderSide(color: Color(0xFF2563EB)),
    ),
  );
}
