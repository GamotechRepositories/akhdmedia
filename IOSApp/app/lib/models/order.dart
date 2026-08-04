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
    this.paymentProvider = '',
    this.licenseEmailResendCount = 0,
    this.maxLicenseEmailResends = 2,
    this.licenseEmailResendsRemaining = 1,
    this.isLicenseEmailResendWindowOpen = false,
    this.canResendLicenseEmail = false,
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
  final int licenseEmailResendCount;
  final int maxLicenseEmailResends;
  final int licenseEmailResendsRemaining;
  final bool isLicenseEmailResendWindowOpen;
  final bool canResendLicenseEmail;
  final DateTime? licenseEmailResendWindowEndsAt;
  final DateTime? createdAt;

  bool get isPaid => paymentStatus == 'paid';

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
      paymentProvider: json['paymentProvider']?.toString() ?? '',
      paymentStatus: json['paymentStatus']?.toString() ?? '',
      totalAmount: json['totalAmount'] is num ? json['totalAmount'] as num : 0,
      subtotalAmount: json['subtotalAmount'] is num ? json['subtotalAmount'] as num : 0,
      gstAmount: json['gstAmount'] is num ? json['gstAmount'] as num : 0,
      status: json['status']?.toString() ?? '',
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
      licenseEmailResendWindowEndsAt:
          windowEndsRaw != null ? DateTime.tryParse(windowEndsRaw) : null,
      createdAt: createdAtRaw != null ? DateTime.tryParse(createdAtRaw) : null,
    );
  }
}
