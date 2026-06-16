import 'dart:async';

import 'package:razorpay_flutter/razorpay_flutter.dart';

class RazorpayPaymentResult {
  const RazorpayPaymentResult({
    required this.razorpayOrderId,
    required this.razorpayPaymentId,
    required this.razorpaySignature,
  });

  final String razorpayOrderId;
  final String razorpayPaymentId;
  final String razorpaySignature;
}

class RazorpayCheckout {
  RazorpayCheckout() : _razorpay = Razorpay();

  final Razorpay _razorpay;
  Completer<RazorpayPaymentResult>? _completer;

  Future<RazorpayPaymentResult> open({
    required String keyId,
    required int amount,
    required String currency,
    required String razorpayOrderId,
    required String name,
    required String description,
    required String customerName,
    required String customerEmail,
    required String customerPhone,
  }) {
    _completer?.completeError(Exception('Payment replaced'));
    _completer = Completer<RazorpayPaymentResult>();

    _razorpay
      ..clear()
      ..on(Razorpay.EVENT_PAYMENT_SUCCESS, _onSuccess)
      ..on(Razorpay.EVENT_PAYMENT_ERROR, _onError)
      ..on(Razorpay.EVENT_EXTERNAL_WALLET, _onExternalWallet);

    _razorpay.open({
      'key': keyId,
      'amount': amount,
      'currency': currency,
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
    final orderId = response.orderId ?? '';
    final paymentId = response.paymentId ?? '';
    final signature = response.signature ?? '';

    if (orderId.isEmpty || paymentId.isEmpty || signature.isEmpty) {
      _completer?.completeError(Exception('Incomplete payment response'));
      return;
    }

    _completer?.complete(
      RazorpayPaymentResult(
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
      ),
    );
  }

  void _onError(PaymentFailureResponse response) {
    final message = response.message ?? 'Payment failed';
    _completer?.completeError(Exception(message));
  }

  void _onExternalWallet(ExternalWalletResponse response) {
    _completer?.completeError(
      Exception('External wallet selected: ${response.walletName}'),
    );
  }
}
