import 'billing_address.dart';
import 'order_item.dart';

class Order {
  const Order({
    required this.id,
    required this.orderNumber,
    required this.items,
    required this.billingAddress,
    required this.paymentMethod,
    required this.paymentStatus,
    required this.totalAmount,
    required this.status,
    this.subtotalAmount = 0,
    this.gstAmount = 0,
    this.paymentProvider = 'razorpay',
    this.razorpayOrderId = '',
    this.razorpayPaymentId = '',
    this.paypalOrderId = '',
    this.paypalCaptureId = '',
    this.licenseEmailResendCount = 0,
    this.maxLicenseEmailResends = 2,
    this.licenseEmailResendsRemaining = 1,
    this.isLicenseEmailResendWindowOpen = false,
    this.canResendLicenseEmail = false,
    this.canResumePayment = true,
    this.paymentBlockReason = '',
    this.unavailableItems = const [],
    this.licenseEmailResendWindowEndsAt,
    this.createdAt,
  });

  final String id;
  final String orderNumber;
  final List<OrderItem> items;
  final BillingAddress billingAddress;
  final String paymentMethod;
  final String paymentProvider;
  final String paymentStatus;
  final num totalAmount;
  final num subtotalAmount;
  final num gstAmount;
  final String status;
  final String razorpayOrderId;
  final String razorpayPaymentId;
  final String paypalOrderId;
  final String paypalCaptureId;
  final int licenseEmailResendCount;
  final int maxLicenseEmailResends;
  final int licenseEmailResendsRemaining;
  final bool isLicenseEmailResendWindowOpen;
  final bool canResendLicenseEmail;
  final bool canResumePayment;
  final String paymentBlockReason;
  final List<UnavailableOrderItem> unavailableItems;
  final DateTime? licenseEmailResendWindowEndsAt;
  final DateTime? createdAt;

  bool get isPaid => paymentStatus == 'paid';
  bool get isPaymentPending =>
      paymentMethod == 'online' && paymentStatus == 'pending' && status == 'pending';

  int get itemCount => items.fold(0, (sum, item) => sum + item.quantity);

  OrderItem? get firstItem => items.isEmpty ? null : items.first;

  String get shortOrderNumber {
    if (orderNumber.length <= 8) return orderNumber.toUpperCase();
    return orderNumber.substring(orderNumber.length - 8).toUpperCase();
  }

  factory Order.fromJson(Map<String, dynamic> json) {
    final billing = json['billingAddress'];
    final createdAtRaw = json['createdAt']?.toString();
    final windowEndsRaw = json['licenseEmailResendWindowEndsAt']?.toString();
    final itemsJson = json['items'] as List<dynamic>? ?? [];
    final unavailableJson = json['unavailableItems'] as List<dynamic>? ?? [];

    return Order(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber']?.toString() ?? '',
      items: itemsJson
          .whereType<Map<String, dynamic>>()
          .map(OrderItem.fromJson)
          .toList(),
      billingAddress: billing is Map<String, dynamic>
          ? BillingAddress.fromJson(billing)
          : const BillingAddress(),
      paymentMethod: json['paymentMethod']?.toString() ?? '',
      paymentProvider: json['paymentProvider']?.toString() ?? 'razorpay',
      paymentStatus: json['paymentStatus']?.toString() ?? '',
      totalAmount: json['totalAmount'] is num ? json['totalAmount'] as num : 0,
      subtotalAmount: json['subtotalAmount'] is num ? json['subtotalAmount'] as num : 0,
      gstAmount: json['gstAmount'] is num ? json['gstAmount'] as num : 0,
      status: json['status']?.toString() ?? '',
      razorpayOrderId: json['razorpayOrderId']?.toString() ?? '',
      razorpayPaymentId: json['razorpayPaymentId']?.toString() ?? '',
      paypalOrderId: json['paypalOrderId']?.toString() ?? '',
      paypalCaptureId: json['paypalCaptureId']?.toString() ?? '',
      licenseEmailResendCount: json['licenseEmailResendCount'] is int
          ? json['licenseEmailResendCount'] as int
          : 0,
      maxLicenseEmailResends: json['maxLicenseEmailResends'] is int
          ? json['maxLicenseEmailResends'] as int
          : 2,
      licenseEmailResendsRemaining: json['licenseEmailResendsRemaining'] is int
          ? json['licenseEmailResendsRemaining'] as int
          : 2,
      isLicenseEmailResendWindowOpen:
          json['isLicenseEmailResendWindowOpen'] == true,
      canResendLicenseEmail: json['canResendLicenseEmail'] == true,
      canResumePayment: json['canResumePayment'] != false,
      paymentBlockReason: json['paymentBlockReason']?.toString() ?? '',
      unavailableItems: unavailableJson
          .whereType<Map<String, dynamic>>()
          .map(UnavailableOrderItem.fromJson)
          .toList(),
      licenseEmailResendWindowEndsAt:
          windowEndsRaw != null ? DateTime.tryParse(windowEndsRaw) : null,
      createdAt: createdAtRaw != null ? DateTime.tryParse(createdAtRaw) : null,
    );
  }
}

class RazorpayCheckoutData {
  const RazorpayCheckoutData({
    required this.keyId,
    required this.orderId,
    required this.amount,
    required this.currency,
  });

  final String keyId;
  final String orderId;
  final int amount;
  final String currency;

  factory RazorpayCheckoutData.fromJson(Map<String, dynamic> json) {
    return RazorpayCheckoutData(
      keyId: json['keyId']?.toString() ?? '',
      orderId: json['orderId']?.toString() ?? '',
      amount: json['amount'] is int
          ? json['amount'] as int
          : int.tryParse(json['amount']?.toString() ?? '') ?? 0,
      currency: json['currency']?.toString() ?? 'INR',
    );
  }
}

class PayPalCheckoutData {
  const PayPalCheckoutData({
    required this.orderId,
    required this.approvalUrl,
    this.currency = 'USD',
    this.amount = 0,
    this.inrAmount = 0,
  });

  final String orderId;
  final String approvalUrl;
  final String currency;
  final num amount;
  final num inrAmount;

  factory PayPalCheckoutData.fromJson(Map<String, dynamic> json) {
    return PayPalCheckoutData(
      orderId: json['orderId']?.toString() ?? '',
      approvalUrl: json['approvalUrl']?.toString() ?? '',
      currency: json['currency']?.toString() ?? 'USD',
      amount: json['amount'] is num ? json['amount'] as num : 0,
      inrAmount: json['inrAmount'] is num ? json['inrAmount'] as num : 0,
    );
  }
}

class CreateOrderResult {
  const CreateOrderResult({
    required this.order,
    this.razorpay,
    this.paypal,
  });

  final Order order;
  final RazorpayCheckoutData? razorpay;
  final PayPalCheckoutData? paypal;
}
