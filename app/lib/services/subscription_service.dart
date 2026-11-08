import 'api_client.dart';

/// Uses the same authenticated session and contracts as the website.
class SubscriptionService {
  SubscriptionService(this.api);
  final ApiClient api;

  Future<Map<String, dynamic>> _get(String path) async =>
      Map<String, dynamic>.from(
        (await api.getJson('/subscriptions/$path'))['data'] as Map,
      );
  Future<Map<String, dynamic>> _post(
    String path,
    Map<String, dynamic> body,
  ) async => Map<String, dynamic>.from(
    (await api.postJson('/subscriptions/$path', data: body))['data'] as Map? ??
        {},
  );
  Future<Map<String, dynamic>> plans() => _get('plans');
  Future<Map<String, dynamic>> mine() => _get('my-subscription');
  Future<Map<String, dynamic>> checkout(
    String id,
    String provider,
    String phone,
  ) => _post('checkout', {
    'planId': id,
    'paymentProvider': provider,
    'whatsappNumber': phone,
    'policyAgreed': true,
  });
  Future<Map<String, dynamic>> verify(Map<String, dynamic> payload) =>
      _post('verify', payload);
  Future<Map<String, dynamic>> verifyPayPal(String id) =>
      _post('paypal/verify', {'subscriptionId': id});
  Future<void> cancel(String id) async {
    await api.postJson('/subscriptions/cancel', data: {'subscriptionId': id});
  }

  Future<List<int>> invoice(String id) =>
      api.getBytes('/subscriptions/invoice-pdf/$id');
}
