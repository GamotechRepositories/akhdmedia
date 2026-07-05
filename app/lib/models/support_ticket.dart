class SupportTicketReply {
  const SupportTicketReply({
    required this.message,
    required this.sentAt,
  });

  final String message;
  final DateTime? sentAt;

  factory SupportTicketReply.fromJson(Map<String, dynamic> json) {
    return SupportTicketReply(
      message: json['message']?.toString() ?? '',
      sentAt: _parseDate(json['sentAt']),
    );
  }
}

class SupportTicket {
  const SupportTicket({
    required this.id,
    required this.ticketNumber,
    required this.subject,
    required this.message,
    required this.status,
    required this.orderNumber,
    required this.replies,
    this.createdAt,
    this.updatedAt,
    this.lastReplyAt,
  });

  final String id;
  final String ticketNumber;
  final String subject;
  final String message;
  final String status;
  final String orderNumber;
  final List<SupportTicketReply> replies;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? lastReplyAt;

  bool get hasTeamReply => replies.isNotEmpty;

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    final rawReplies = json['replies'];
    final replies = rawReplies is List
        ? rawReplies
            .whereType<Map<String, dynamic>>()
            .map(SupportTicketReply.fromJson)
            .toList()
        : <SupportTicketReply>[];

    return SupportTicket(
      id: json['id']?.toString() ?? '',
      ticketNumber: json['ticketNumber']?.toString() ?? '',
      subject: json['subject']?.toString() ?? 'other',
      message: json['message']?.toString() ?? '',
      status: json['status']?.toString() ?? 'open',
      orderNumber: json['orderNumber']?.toString() ?? '',
      replies: replies,
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
      lastReplyAt: _parseDate(json['lastReplyAt']),
    );
  }
}

DateTime? _parseDate(Object? value) {
  if (value == null) return null;
  return DateTime.tryParse(value.toString());
}

String supportSubjectLabel(String subject) {
  for (final entry in _supportSubjectLabels.entries) {
    if (entry.key == subject) return entry.value;
  }
  return 'Support request';
}

String supportStatusLabel(String status) {
  switch (status) {
    case 'in_progress':
      return 'In progress';
    case 'resolved':
      return 'Resolved';
    case 'closed':
      return 'Closed';
    case 'open':
    default:
      return 'Open';
  }
}

const _supportSubjectLabels = {
  'license_email': 'License / download email',
  'download': 'Video download',
  'payment': 'Payment issue',
  'license': 'License verification',
  'other': 'Other',
};
