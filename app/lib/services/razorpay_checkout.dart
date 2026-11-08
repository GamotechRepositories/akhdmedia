import 'dart:async';

import 'package:razorpay_flutter/razorpay_flutter.dart';

class RazorpayPaymentResult {
  const RazorpayPaymentResult({
    required this.razorpayOrderId,
    required this.razorpayPaymentId,
    required this.razorpaySignature,
    this.razorpaySubscriptionId,
  });

  final String razorpayOrderId;
  final String razorpayPaymentId;
  final String razorpaySignature;
  final String? razorpaySubscriptionId;
}

class RazorpayCheckout {
  RazorpayCheckout() : _razorpay = Razorpay();

  final Razorpay _razorpay;
  Completer<RazorpayPaymentResult>? _completer;
  String? _subscriptionId;

  Future<RazorpayPaymentResult> open({
    required String keyId,
    required int amount,
    required String currency,
    String razorpayOrderId = '',
    String? razorpaySubscriptionId,
    required String name,
    required String description,
    required String customerName,
    required String customerEmail,
    required String customerPhone,
  }) {
    if (_completer != null && !_completer!.isCompleted) {
      _completer!.completeError(Exception('Payment replaced'));
    }
    _subscriptionId = razorpaySubscriptionId;
    _completer = Completer<RazorpayPaymentResult>();

    _razorpay
      ..clear()
      ..on(Razorpay.EVENT_PAYMENT_SUCCESS, _onSuccess)
      ..on(Razorpay.EVENT_PAYMENT_ERROR, _onError)
      ..on(Razorpay.EVENT_EXTERNAL_WALLET, _onExternalWallet);

    _razorpay.open({
      'key': keyId,
      if (razorpaySubscriptionId == null) 'amount': amount,
      'currency': currency,
      if (razorpaySubscriptionId != null)
        'subscription_id': razorpaySubscriptionId
      else
        'order_id': razorpayOrderId,
      'name': name,
      'description': description,
      'prefill': {
        'name': customerName,
        'email': customerEmail,
        'contact': customerPhone,
      },
      'theme': {'color': '#111827'},
    });

    return _completer!.future;
  }

  void dispose() {
    _razorpay.clear();
    _completer = null;
  }

  void _onSuccess(PaymentSuccessResponse response) {
    if (_completer == null || _completer!.isCompleted) return;
    final orderId = response.orderId ?? '';
    final paymentId = response.paymentId ?? '';
    final signature = response.signature ?? '';

    if ((_subscriptionId == null && orderId.isEmpty) ||
        paymentId.isEmpty ||
        signature.isEmpty) {
      _completer?.completeError(Exception('Incomplete payment response'));
      return;
    }

    _completer?.complete(
      RazorpayPaymentResult(
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        razorpaySubscriptionId:
            response.data?['razorpay_subscription_id']?.toString() ??
            _subscriptionId,
      ),
    );
  }

  void _onError(PaymentFailureResponse response) {
    if (_completer == null || _completer!.isCompleted) return;
    final message = response.message ?? 'Payment failed';
    _completer?.completeError(Exception(message));
  }

  void _onExternalWallet(ExternalWalletResponse response) {
    if (_completer == null || _completer!.isCompleted) return;
    _completer?.completeError(
      Exception('External wallet selected: ${response.walletName}'),
    );
  }
}
