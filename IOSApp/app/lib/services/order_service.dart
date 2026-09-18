import '../models/billing_address.dart';
import '../models/order.dart';
import 'api_client.dart';

class OrderService {
  OrderService(this._api);

  final ApiClient _api;

  Future<BillingAddress?> getCheckoutProfile() async {
    final response = await _api.getJson('/orders/profile');
    final billing = response['data']?['billingAddress'];
    if (billing is Map<String, dynamic>) {
      return BillingAddress.fromJson(billing);
    }
    return null;
  }

  Future<BillingAddress> saveCheckoutProfile(BillingAddress address) async {
    final response = await _api.putJson('/orders/profile', data: address.toJson());
    final billing = response['data']?['billingAddress'];
    if (billing is Map<String, dynamic>) {
      return BillingAddress.fromJson(billing);
    }
    return address;
  }

  Future<Order> getOrder(String orderId) async {
    final response = await _api.getJson('/orders/$orderId');
    final orderJson = response['data']?['order'];
    if (orderJson is! Map<String, dynamic>) {
      throw Exception('Order not found');
    }
    return Order.fromJson(orderJson);
  }

  Future<void> resendLicenseEmail(String orderId) async {
    await _api.postJson('/orders/$orderId/resend-email');
  }

  Future<List<int>> downloadLicenseCertificate(String orderId) async {
    return _api.getBytes('/orders/$orderId/license-certificate');
  }

  Future<List<int>> downloadLicenseAgreement(String orderId) async {
    return _api.getBytes('/orders/$orderId/license-agreement');
  }

  Future<List<Order>> getUserOrders() async {
    final response = await _api.getJson('/user/orders');
    final ordersJson = response['data']?['orders'] as List<dynamic>? ?? [];
    return ordersJson
        .whereType<Map<String, dynamic>>()
        .map(Order.fromJson)
        .where((order) => order.isPaid)
        .toList();
  }

  Future<Order> verifyApplePurchase({
    required String productId,
    required String appleProductId,
    required String transactionId,
    String originalTransactionId = '',
    String receiptData = '',
    String imageSize = '',
    Map<String, dynamic>? billingAddress,
  }) async {
    final response = await _api.postJson(
      '/payments/apple/verify',
      data: {
        'productId': productId,
        'appleProductId': appleProductId,
        'transactionId': transactionId,
        'originalTransactionId': originalTransactionId,
        'receiptData': receiptData,
        'imageSize': imageSize,
        if (billingAddress != null) 'billingAddress': billingAddress,
      },
    );

    final orderJson = response['data']?['order'];
    if (orderJson is! Map<String, dynamic>) {
      throw Exception('Apple purchase verification failed');
    }
    return Order.fromJson(orderJson);
  }
}
