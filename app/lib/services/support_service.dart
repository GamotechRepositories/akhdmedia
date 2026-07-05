import '../models/support_ticket.dart';
import 'api_client.dart';

class SupportService {
  SupportService(this._api);

  final ApiClient _api;

  Future<List<SupportTicket>> getMyTickets() async {
    final response = await _api.getJson('/support/mine');
    final data = response['data'];
    if (data is! Map<String, dynamic>) return const [];

    final requests = data['requests'];
    if (requests is! List) return const [];

    return requests
        .whereType<Map<String, dynamic>>()
        .map(SupportTicket.fromJson)
        .toList();
  }

  Future<String> submitRequest({
    required String name,
    required String email,
    required String phone,
    required String orderNumber,
    required String subject,
    required String message,
  }) async {
    final response = await _api.postJson('/support', data: {
      'name': name,
      'email': email,
      'phone': phone,
      'orderNumber': orderNumber,
      'subject': subject,
      'message': message,
    });

    final ticket = response['data']?['request']?['ticketNumber']?.toString();
    if (ticket == null || ticket.isEmpty) {
      throw Exception('Support request failed');
    }
    return ticket;
  }
}
