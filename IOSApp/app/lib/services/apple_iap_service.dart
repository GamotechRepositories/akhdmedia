import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

class ApplePurchaseResult {
  const ApplePurchaseResult({
    required this.productId,
    required this.transactionId,
    required this.originalTransactionId,
    required this.receiptData,
  });

  final String productId;
  final String transactionId;
  final String originalTransactionId;
  final String receiptData;
}

class AppleIapService {
  AppleIapService() {
    _subscription = _iap.purchaseStream.listen(
      _onPurchaseUpdate,
      onError: (Object error) {
        _failPending(error.toString());
      },
    );
  }

  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _subscription;

  Completer<ApplePurchaseResult>? _pending;
  String? _pendingProductId;

  Future<bool> isAvailable() => _iap.isAvailable();

  Future<ProductDetails?> queryProduct(String productId) async {
    final available = await _iap.isAvailable();
    if (!available) {
      throw Exception('In-App Purchases are not available on this device.');
    }

    final response = await _iap.queryProductDetails({productId});
    if (response.error != null) {
      throw Exception(response.error!.message);
    }
    if (response.productDetails.isEmpty) {
      throw Exception(
        'Apple product "$productId" was not found. Create it in App Store Connect / StoreKit config.',
      );
    }
    return response.productDetails.first;
  }

  Future<ApplePurchaseResult> buyProduct(String productId) async {
    if (_pending != null) {
      throw Exception('Another Apple purchase is already in progress.');
    }

    final product = await queryProduct(productId);
    if (product == null) {
      throw Exception('Apple product not found.');
    }

    _pending = Completer<ApplePurchaseResult>();
    _pendingProductId = productId;

    final started = await _iap.buyNonConsumable(
      purchaseParam: PurchaseParam(productDetails: product),
    );

    if (!started) {
      _pending = null;
      _pendingProductId = null;
      throw Exception('Could not start Apple purchase.');
    }

    return _pending!.future.timeout(
      const Duration(minutes: 5),
      onTimeout: () {
        _pending = null;
        _pendingProductId = null;
        throw Exception('Apple purchase timed out.');
      },
    );
  }

  Future<void> _onPurchaseUpdate(List<PurchaseDetails> purchases) async {
    for (final purchase in purchases) {
      if (_pendingProductId != null &&
          purchase.productID != _pendingProductId &&
          purchase.status != PurchaseStatus.error &&
          purchase.status != PurchaseStatus.canceled) {
        // Unrelated purchase update — still complete to clear the queue.
        if (purchase.pendingCompletePurchase) {
          await _iap.completePurchase(purchase);
        }
        continue;
      }

      switch (purchase.status) {
        case PurchaseStatus.pending:
          break;
        case PurchaseStatus.canceled:
          _failPending('Purchase canceled.');
          if (purchase.pendingCompletePurchase) {
            await _iap.completePurchase(purchase);
          }
          break;
        case PurchaseStatus.error:
          _failPending(purchase.error?.message ?? 'Apple purchase failed.');
          if (purchase.pendingCompletePurchase) {
            await _iap.completePurchase(purchase);
          }
          break;
        case PurchaseStatus.purchased:
        case PurchaseStatus.restored:
          final transactionId =
              purchase.purchaseID?.trim().isNotEmpty == true
                  ? purchase.purchaseID!.trim()
                  : purchase.verificationData.serverVerificationData;
          final receipt = purchase.verificationData.serverVerificationData;
          _succeedPending(
            ApplePurchaseResult(
              productId: purchase.productID,
              transactionId: transactionId,
              originalTransactionId: transactionId,
              receiptData: receipt,
            ),
          );
          if (purchase.pendingCompletePurchase) {
            await _iap.completePurchase(purchase);
          }
          break;
      }
    }
  }

  void _succeedPending(ApplePurchaseResult result) {
    final completer = _pending;
    _pending = null;
    _pendingProductId = null;
    if (completer != null && !completer.isCompleted) {
      completer.complete(result);
    }
  }

  void _failPending(String message) {
    final completer = _pending;
    _pending = null;
    _pendingProductId = null;
    if (completer != null && !completer.isCompleted) {
      completer.completeError(Exception(message));
    } else {
      debugPrint('[AppleIAP] $message');
    }
  }

  Future<void> dispose() async {
    await _subscription?.cancel();
    _subscription = null;
  }
}
