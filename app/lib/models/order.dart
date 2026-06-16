import 'billing_address.dart';

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
    this.razorpayOrderId = '',
    this.razorpayPaymentId = '',
    this.licenseEmailResendCount = 0,
    this.maxLicenseEmailResends = 3,
    this.licenseEmailResendsRemaining = 3,
    this.isLicenseEmailResendWindowOpen = false,
    this.canResendLicenseEmail = false,
    this.canResumePayment = true,
    this.createdAt,
  });

  final String id;
  final String orderNumber;
  final List<Map<String, dynamic>> items;
  final BillingAddress billingAddress;
  final String paymentMethod;
  final String paymentStatus;
  final num totalAmount;
  final String status;
  final String razorpayOrderId;
  final String razorpayPaymentId;
  final int licenseEmailResendCount;
  final int maxLicenseEmailResends;
  final int licenseEmailResendsRemaining;
  final bool isLicenseEmailResendWindowOpen;
  final bool canResendLicenseEmail;
  final bool canResumePayment;
  final DateTime? createdAt;

  bool get isPaid => paymentStatus == 'paid';
  bool get isPaymentPending =>
      paymentMethod == 'online' && paymentStatus == 'pending' && status == 'pending';

  String get shortOrderNumber {
    if (orderNumber.length <= 8) return orderNumber.toUpperCase();
    return orderNumber.substring(orderNumber.length - 8).toUpperCase();
  }

  factory Order.fromJson(Map<String, dynamic> json) {
    final billing = json['billingAddress'];
    final createdAtRaw = json['createdAt']?.toString();

    return Order(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber']?.toString() ?? '',
      items: (json['items'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .toList(),
      billingAddress: billing is Map<String, dynamic>
          ? BillingAddress.fromJson(billing)
          : const BillingAddress(),
      paymentMethod: json['paymentMethod']?.toString() ?? '',
      paymentStatus: json['paymentStatus']?.toString() ?? '',
      totalAmount: json['totalAmount'] is num ? json['totalAmount'] as num : 0,
      status: json['status']?.toString() ?? '',
      razorpayOrderId: json['razorpayOrderId']?.toString() ?? '',
      razorpayPaymentId: json['razorpayPaymentId']?.toString() ?? '',
      licenseEmailResendCount: json['licenseEmailResendCount'] is int
          ? json['licenseEmailResendCount'] as int
          : 0,
      maxLicenseEmailResends: json['maxLicenseEmailResends'] is int
          ? json['maxLicenseEmailResends'] as int
          : 3,
      licenseEmailResendsRemaining: json['licenseEmailResendsRemaining'] is int
          ? json['licenseEmailResendsRemaining'] as int
          : 3,
      isLicenseEmailResendWindowOpen:
          json['isLicenseEmailResendWindowOpen'] == true,
      canResendLicenseEmail: json['canResendLicenseEmail'] == true,
      canResumePayment: json['canResumePayment'] != false,
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

class CreateOrderResult {
  const CreateOrderResult({required this.order, required this.razorpay});

  final Order order;
  final RazorpayCheckoutData razorpay;
}
