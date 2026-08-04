import 'package:intl/intl.dart';

class Formatters {
  static String currency(num amount) {
    if (amount <= 0) return 'Price on request';
    final formatter = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );
    return formatter.format(amount);
  }
}
