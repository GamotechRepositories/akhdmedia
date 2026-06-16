class BillingAddress {
  const BillingAddress({
    this.name = '',
    this.email = '',
    this.phone = '',
    this.purchaseReasons = const [],
    this.purchaseReasonOther = '',
  });

  final String name;
  final String email;
  final String phone;
  final List<String> purchaseReasons;
  final String purchaseReasonOther;

  BillingAddress copyWith({
    String? name,
    String? email,
    String? phone,
    List<String>? purchaseReasons,
    String? purchaseReasonOther,
  }) {
    return BillingAddress(
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      purchaseReasons: purchaseReasons ?? this.purchaseReasons,
      purchaseReasonOther: purchaseReasonOther ?? this.purchaseReasonOther,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name.trim(),
      'email': email.trim(),
      'phone': phone.trim(),
      'purchaseReasons': purchaseReasons,
      'purchaseReasonOther': purchaseReasonOther.trim(),
    };
  }

  factory BillingAddress.fromJson(Map<String, dynamic> json) {
    final reasons = json['purchaseReasons'];
    return BillingAddress(
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      purchaseReasons: reasons is List
          ? reasons.map((e) => e.toString()).toList()
          : const [],
      purchaseReasonOther: json['purchaseReasonOther']?.toString() ?? '',
    );
  }
}
