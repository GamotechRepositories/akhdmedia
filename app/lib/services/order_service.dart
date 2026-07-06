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

  Future<CreateOrderResult> createOrder(
    BillingAddress billingAddress, {
    String paymentProvider = 'razorpay',
  }) async {
    final response = await _api.postJson('/orders', data: {
      'billingAddress': billingAddress.toJson(),
      'paymentMethod': 'online',
      'paymentProvider': paymentProvider,
    });

    final orderJson = response['data']?['order'];
    if (orderJson is! Map<String, dynamic>) {
      throw Exception('Invalid order response');
    }

    final razorpayJson = response['data']?['razorpay'];
    final paypalJson = response['data']?['paypal'];

    return CreateOrderResult(
      order: Order.fromJson(orderJson),
      razorpay: razorpayJson is Map<String, dynamic>
          ? RazorpayCheckoutData.fromJson(razorpayJson)
          : null,
      paypal: paypalJson is Map<String, dynamic>
          ? PayPalCheckoutData.fromJson(paypalJson)
          : null,
    );
  }

  Future<Order> getOrder(String orderId) async {
    final response = await _api.getJson('/orders/$orderId');
    final orderJson = response['data']?['order'];
    if (orderJson is! Map<String, dynamic>) {
      throw Exception('Order not found');
    }
    return Order.fromJson(orderJson);
  }

  Future<CreateOrderResult> resumePayment(String orderId) async {
    final response = await _api.postJson('/orders/$orderId/payment');
    final orderJson = response['data']?['order'];
    if (orderJson is! Map<String, dynamic>) {
      throw Exception('Payment unavailable');
    }

    final razorpayJson = response['data']?['razorpay'];
    final paypalJson = response['data']?['paypal'];

    return CreateOrderResult(
      order: Order.fromJson(orderJson),
      razorpay: razorpayJson is Map<String, dynamic>
          ? RazorpayCheckoutData.fromJson(razorpayJson)
          : null,
      paypal: paypalJson is Map<String, dynamic>
          ? PayPalCheckoutData.fromJson(paypalJson)
          : null,
    );
  }

  Future<Order> capturePayPalPayment({
    required String orderId,
    required String paypalOrderId,
    bool clearCart = true,
  }) async {
    final response = await _api.postJson('/payments/paypal/capture', data: {
      'orderId': orderId,
      'paypalOrderId': paypalOrderId,
      'clearCart': clearCart,
    });
    final orderJson = response['data']?['order'];
    if (orderJson is! Map<String, dynamic>) {
      throw Exception('Payment verification failed');
    }
    return Order.fromJson(orderJson);
  }

  Future<Map<String, dynamic>> getPaymentConfig() async {
    final response = await _api.getJson('/payments/config');
    return response['data'] is Map<String, dynamic>
        ? response['data'] as Map<String, dynamic>
        : <String, dynamic>{};
  }

  Future<Order> verifyRazorpayPayment({
    required String orderId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
    bool clearCart = true,
  }) async {
    final response = await _api.postJson('/payments/razorpay/verify', data: {
      'orderId': orderId,
      'razorpay_order_id': razorpayOrderId,
      'razorpay_payment_id': razorpayPaymentId,
      'razorpay_signature': razorpaySignature,
      'clearCart': clearCart,
    });
    final orderJson = response['data']?['order'];
    if (orderJson is! Map<String, dynamic>) {
      throw Exception('Payment verification failed');
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
        .toList();
  }
}
