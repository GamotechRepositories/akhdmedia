import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/brand.dart';
import '../../core/constants/site_content.dart';
import '../../core/utils/order_formatters.dart';
import '../../models/support_ticket.dart';
import '../../services/api_client.dart';
import '../../services/order_service.dart';
import '../../services/support_service.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  List<SupportTicket> _tickets = [];
  bool _loadingTickets = true;
  String? _ticketsError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadTickets();
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

  Future<void> _loadTickets() async {
    setState(() {
      _loadingTickets = true;
      _ticketsError = null;
    });

    try {
      final tickets = await context.read<SupportService>().getMyTickets();
      if (!mounted) return;
      setState(() => _tickets = tickets);
    } catch (e) {
      if (!mounted) return;
      setState(() => _ticketsError = ApiClient.unwrapError(e).toString());
    } finally {
      if (mounted) setState(() => _loadingTickets = false);
    }
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
        onSubmitted: _loadTickets,
      ),
    );
  }

  void _openTicketDetail(SupportTicket ticket) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _SupportTicketDetailSheet(ticket: ticket),
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
        child: RefreshIndicator(
          onRefresh: _loadTickets,
          color: const Color(0xFF2563EB),
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            children: [
            _SupportHeader(onBack: () => context.pop()),
            const SizedBox(height: 16),
            const _SupportHeroBanner(),
            const SizedBox(height: 22),
            const _SectionTitle('Contact Us'),
            const SizedBox(height: 12),
            _ContactCard(
              children: [
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
                  onTap: () => context.push('/editorial-policy'),
                ),
                _ContactRow(
                  icon: Icons.balance_outlined,
                  title: 'Legal Policy',
                  subtitle: 'Legal terms, ownership, and compliance',
                  showAction: false,
                  showChevron: true,
                  onTap: () => context.push('/legal-policy'),
                ),
                _ContactRow(
                  icon: Icons.badge_outlined,
                  title: 'MEDIA ACCREDITATION & EDITORIAL EVENT COVERAGE POLICY',
                  subtitle: 'Editorial event coverage and accreditation',
                  showAction: false,
                  showChevron: true,
                  showDivider: false,
                  onTap: () => context.push('/media-accreditation-policy'),
                ),
              ],
            ),
            const SizedBox(height: 22),
            Row(
              children: [
                const Expanded(child: _SectionTitle('My Tickets')),
                TextButton.icon(
                  onPressed: () => _openContactSheet(),
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: const Text(
                    'New ticket',
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
            _MyTicketsSection(
              tickets: _tickets,
              loading: _loadingTickets,
              error: _ticketsError,
              onRetry: _loadTickets,
              onTicketTap: _openTicketDetail,
              onNewTicket: () => _openContactSheet(),
            ),
            const SizedBox(height: 20),
            const _ExperienceBanner(),
          ],
          ),
        ),
      ),
    );
  }
}

class _MyTicketsSection extends StatelessWidget {
  const _MyTicketsSection({
    required this.tickets,
    required this.loading,
    required this.onRetry,
    required this.onTicketTap,
    required this.onNewTicket,
    this.error,
  });

  final List<SupportTicket> tickets;
  final bool loading;
  final String? error;
  final VoidCallback onRetry;
  final ValueChanged<SupportTicket> onTicketTap;
  final VoidCallback onNewTicket;

  @override
  Widget build(BuildContext context) {
    if (loading && tickets.isEmpty) {
      return const _ContactCard(
        children: [
          Padding(
            padding: EdgeInsets.symmetric(vertical: 28),
            child: Center(
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2.5, color: Color(0xFF2563EB)),
              ),
            ),
          ),
        ],
      );
    }

    if (error != null && tickets.isEmpty) {
      return _ContactCard(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                const Icon(Icons.error_outline_rounded, color: Color(0xFF94A3B8)),
                const SizedBox(height: 8),
                Text(
                  'Could not load tickets',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                ),
                const SizedBox(height: 4),
                Text(
                  error!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                ),
                const SizedBox(height: 12),
                TextButton(onPressed: onRetry, child: const Text('Try again')),
              ],
            ),
          ),
        ],
      );
    }

    if (tickets.isEmpty) {
      return _ContactCard(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.confirmation_number_outlined, color: Color(0xFF2563EB)),
                ),
                const SizedBox(height: 12),
                const Text(
                  'No tickets yet',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF0F172A)),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Submit a support request and track its status here.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: onNewTicket,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Create ticket'),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return _ContactCard(
      children: [
        for (var i = 0; i < tickets.length; i++)
          _TicketRow(
            ticket: tickets[i],
            onTap: () => onTicketTap(tickets[i]),
            showDivider: i < tickets.length - 1,
          ),
      ],
    );
  }
}

class _TicketRow extends StatelessWidget {
  const _TicketRow({
    required this.ticket,
    required this.onTap,
    this.showDivider = true,
  });

  final SupportTicket ticket;
  final VoidCallback onTap;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final statusColors = _ticketStatusColors(ticket.status);
    final updated = ticket.lastReplyAt ?? ticket.updatedAt ?? ticket.createdAt;

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
                    child: const Icon(Icons.confirmation_number_outlined, color: Color(0xFF2563EB), size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                '#${ticket.ticketNumber}',
                                style: const TextStyle(
                                  fontFamily: 'monospace',
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: statusColors.bg,
                                borderRadius: BorderRadius.circular(999),
                                border: Border.all(color: statusColors.border),
                              ),
                              child: Text(
                                supportStatusLabel(ticket.status),
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: statusColors.text,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          supportSubjectLabel(ticket.subject),
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Updated ${OrderFormatters.formatDateShort(updated)}',
                          style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 4),
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

({Color bg, Color text, Color border}) _ticketStatusColors(String status) {
  switch (status) {
    case 'in_progress':
      return (
        bg: const Color(0xFFEFF6FF),
        text: const Color(0xFF1D4ED8),
        border: const Color(0xFFBFDBFE),
      );
    case 'resolved':
      return (
        bg: const Color(0xFFF0FDF4),
        text: const Color(0xFF15803D),
        border: const Color(0xFFBBF7D0),
      );
    case 'closed':
      return (
        bg: const Color(0xFFF8FAFC),
        text: const Color(0xFF64748B),
        border: const Color(0xFFE2E8F0),
      );
    case 'open':
    default:
      return (
        bg: const Color(0xFFFFFBEB),
        text: const Color(0xFFB45309),
        border: const Color(0xFFFDE68A),
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
      ],
    );
  }
}

class _SupportHeroBanner extends StatelessWidget {
  const _SupportHeroBanner();

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
      child: Row(
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
                  'Browse our policies below or contact our support team.',
                  style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.35),
                ),
              ],
            ),
          ),
        ],
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
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Text(
                                title,
                                softWrap: true,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0F172A),
                                ),
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

class _SupportContactSheet extends StatefulWidget {
  const _SupportContactSheet({
    this.initialSubject,
    this.initialMessage,
    this.onSubmitted,
  });

  final String? initialSubject;
  final String? initialMessage;
  final Future<void> Function()? onSubmitted;

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
      if (mounted) {
        setState(() => _ticket = ticket);
        await widget.onSubmitted?.call();
      }
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

class _SupportTicketDetailSheet extends StatelessWidget {
  const _SupportTicketDetailSheet({required this.ticket});

  final SupportTicket ticket;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final statusColors = _ticketStatusColors(ticket.status);

    return Container(
      margin: const EdgeInsets.only(top: 48),
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, 12, 20, bottomInset + 20),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
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
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Ticket #${ticket.ticketNumber}',
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColors.bg,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: statusColors.border),
                    ),
                    child: Text(
                      supportStatusLabel(ticket.status),
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: statusColors.text,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                supportSubjectLabel(ticket.subject),
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
              ),
              if (ticket.orderNumber.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  'Order ${ticket.orderNumber}',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                ),
              ],
              const SizedBox(height: 20),
              const Text(
                'Tracking',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 12),
              _TicketTimeline(ticket: ticket),
              const SizedBox(height: 20),
              const Text(
                'Your message',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Text(
                  ticket.message,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF334155), height: 1.45),
                ),
              ),
              if (ticket.replies.isNotEmpty) ...[
                const SizedBox(height: 20),
                const Text(
                  'Team replies',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                ),
                const SizedBox(height: 8),
                for (final reply in ticket.replies)
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFBFDBFE)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          reply.message,
                          style: const TextStyle(fontSize: 13, color: Color(0xFF1E3A8A), height: 1.45),
                        ),
                        if (reply.sentAt != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            OrderFormatters.formatDate(reply.sentAt),
                            style: const TextStyle(fontSize: 11, color: Color(0xFF64748B)),
                          ),
                        ],
                      ],
                    ),
                  ),
              ],
              const SizedBox(height: 16),
              SizedBox(
                height: 48,
                child: FilledButton(
                  onPressed: () => Navigator.pop(context),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text('Close'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TicketTimeline extends StatelessWidget {
  const _TicketTimeline({required this.ticket});

  final SupportTicket ticket;

  @override
  Widget build(BuildContext context) {
    final steps = _buildSteps(ticket);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        children: [
          for (var i = 0; i < steps.length; i++)
            _TimelineStep(
              title: steps[i].title,
              subtitle: steps[i].subtitle,
              isComplete: steps[i].isComplete,
              isActive: steps[i].isActive,
              isLast: i == steps.length - 1,
            ),
        ],
      ),
    );
  }

  List<_TimelineStepData> _buildSteps(SupportTicket ticket) {
    final submitted = ticket.createdAt;
    final inProgress = ticket.status == 'in_progress' ||
        ticket.status == 'resolved' ||
        ticket.status == 'closed';
    final hasReply = ticket.hasTeamReply;
    final resolved = ticket.status == 'resolved' || ticket.status == 'closed';

    return [
      _TimelineStepData(
        title: 'Submitted',
        subtitle: OrderFormatters.formatDate(submitted),
        isComplete: true,
        isActive: ticket.status == 'open',
      ),
      _TimelineStepData(
        title: 'In review',
        subtitle: inProgress
            ? OrderFormatters.formatDate(ticket.updatedAt ?? submitted)
            : 'Waiting for our team',
        isComplete: inProgress,
        isActive: ticket.status == 'in_progress',
      ),
      _TimelineStepData(
        title: 'Team replied',
        subtitle: hasReply
            ? OrderFormatters.formatDate(ticket.lastReplyAt)
            : 'No reply yet',
        isComplete: hasReply,
        isActive: hasReply && !resolved,
      ),
      _TimelineStepData(
        title: ticket.status == 'closed' ? 'Closed' : 'Resolved',
        subtitle: resolved
            ? OrderFormatters.formatDate(ticket.updatedAt)
            : 'Pending resolution',
        isComplete: resolved,
        isActive: resolved,
      ),
    ];
  }
}

class _TimelineStepData {
  const _TimelineStepData({
    required this.title,
    required this.subtitle,
    required this.isComplete,
    required this.isActive,
  });

  final String title;
  final String subtitle;
  final bool isComplete;
  final bool isActive;
}

class _TimelineStep extends StatelessWidget {
  const _TimelineStep({
    required this.title,
    required this.subtitle,
    required this.isComplete,
    required this.isActive,
    required this.isLast,
  });

  final String title;
  final String subtitle;
  final bool isComplete;
  final bool isActive;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final dotColor = isComplete
        ? (isActive ? const Color(0xFF2563EB) : const Color(0xFF16A34A))
        : const Color(0xFFCBD5E1);
    final lineColor = isComplete ? const Color(0xFF93C5FD) : const Color(0xFFE2E8F0);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                color: dotColor,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
                boxShadow: isActive
                    ? [BoxShadow(color: dotColor.withValues(alpha: 0.35), blurRadius: 8)]
                    : null,
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 34,
                color: lineColor,
              ),
          ],
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(bottom: isLast ? 0 : 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isComplete ? const Color(0xFF0F172A) : const Color(0xFF94A3B8),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 11,
                    color: isComplete ? const Color(0xFF64748B) : const Color(0xFFCBD5E1),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
