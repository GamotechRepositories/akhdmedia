import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:akhdmedia_app/services/razorpay_checkout.dart';
import 'package:akhdmedia_app/services/subscription_service.dart';
import 'package:akhdmedia_app/services/api_client.dart';

class RecordingApi implements ApiClient {
  String? path;
  Object? payload;
  Map<String, dynamic> response = {
    'data': {
      'subscription': {'status': 'active'},
    },
  };
  @override
  Future<Map<String, dynamic>> postJson(
    String path, {
    Object? data,
    Map<String, dynamic>? query,
  }) async {
    this.path = path;
    payload = data;
    return response;
  }

  @override
  Future<Map<String, dynamic>> getJson(
    String path, {
    Map<String, dynamic>? query,
  }) async {
    this.path = path;
    return response;
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const channel = MethodChannel('razorpay_flutter');
  Map<dynamic, dynamic>? options;
  Map<String, dynamic> gatewayResponse = {};
  setUp(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
          if (call.method == 'open') {
            options = call.arguments as Map;
            return gatewayResponse;
          }
          return null;
        });
  });
  tearDown(
    () => TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null),
  );
  Future<RazorpayPaymentResult> pay(
    RazorpayCheckout checkout, {
    String? subscription,
    String order = '',
  }) => checkout.open(
    keyId: 'rzp_test_key',
    amount: 10000,
    currency: 'INR',
    razorpayOrderId: order,
    razorpaySubscriptionId: subscription,
    name: 'Test',
    description: 'Test plan',
    customerName: 'Test',
    customerEmail: 'test@example.com',
    customerPhone: '+919876543210',
  );

  test(
    'recurring checkout accepts signed response without an order ID',
    () async {
      gatewayResponse = {
        'type': 0,
        'data': {
          'razorpay_payment_id': 'pay_1',
          'razorpay_signature': 'signature',
          'razorpay_subscription_id': 'sub_1',
        },
      };
      final checkout = RazorpayCheckout();
      addTearDown(checkout.dispose);
      final result = await pay(checkout, subscription: 'sub_1');
      expect(options!['subscription_id'], 'sub_1');
      expect(options!.containsKey('order_id'), isFalse);
      expect(options!.containsKey('amount'), isFalse);
      expect(result.razorpaySubscriptionId, 'sub_1');
      expect(result.razorpayPaymentId, 'pay_1');
    },
  );
  test('existing one-time order checkout keeps its options', () async {
    gatewayResponse = {
      'type': 0,
      'data': {
        'razorpay_payment_id': 'pay_1',
        'razorpay_signature': 'signature',
        'razorpay_order_id': 'order_1',
      },
    };
    final checkout = RazorpayCheckout();
    addTearDown(checkout.dispose);
    final result = await pay(checkout, order: 'order_1');
    expect(options!['order_id'], 'order_1');
    expect(options!['amount'], 10000);
    expect(options!.containsKey('subscription_id'), isFalse);
    expect(result.razorpayOrderId, 'order_1');
  });
  test('unsigned recurring result cannot complete checkout', () async {
    gatewayResponse = {
      'type': 0,
      'data': {'razorpay_payment_id': 'pay_1'},
    };
    final checkout = RazorpayCheckout();
    addTearDown(checkout.dispose);
    await expectLater(pay(checkout, subscription: 'sub_1'), throwsException);
  });
  test('payment cancellation is surfaced for retry', () async {
    gatewayResponse = {
      'type': 1,
      'data': {'code': 2, 'message': 'Payment cancelled'},
    };
    final checkout = RazorpayCheckout();
    addTearDown(checkout.dispose);
    await expectLater(pay(checkout, subscription: 'sub_1'), throwsException);
  });
  test(
    'subscription API uses recurring checkout, verification and per-subscription cancellation contracts',
    () async {
      final api = RecordingApi();
      final service = SubscriptionService(api);
      await service.checkout('plan_1', 'paypal', '+919876543210');
      expect(api.path, '/subscriptions/checkout');
      expect(api.payload, {
        'planId': 'plan_1',
        'paymentProvider': 'paypal',
        'whatsappNumber': '+919876543210',
        'policyAgreed': true,
      });
      await service.verifyPayPal('local_sub_1');
      expect(api.path, '/subscriptions/paypal/verify');
      expect(api.payload, {'subscriptionId': 'local_sub_1'});
      await service.cancel('local_sub_1');
      expect(api.path, '/subscriptions/cancel');
      expect(api.payload, {'subscriptionId': 'local_sub_1'});
      await service.plans();
      expect(api.path, '/subscriptions/plans');
      await service.mine();
      expect(api.path, '/subscriptions/my-subscription');
    },
  );
}
