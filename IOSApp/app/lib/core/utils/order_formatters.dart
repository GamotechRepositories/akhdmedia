import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class OrderFormatters {
  static String formatDate(DateTime? value) {
    if (value == null) return '—';
    return DateFormat('d MMM y, hh:mm a', 'en_IN').format(value.toLocal());
  }

  static String formatDateShort(DateTime? value) {
    if (value == null) return '—';
    return DateFormat('d MMM y', 'en_IN').format(value.toLocal());
  }

  static String paymentStatusLabel(String status) {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Payment pending';
      case 'failed':
        return 'Failed';
      default:
        return status.isEmpty ? 'Unknown' : status;
    }
  }

  static ({Color bg, Color text, Color border}) paymentStatusColors(String status) {
    switch (status) {
      case 'paid':
        return (
          bg: const Color(0xFFF0FDF4),
          text: const Color(0xFF15803D),
          border: const Color(0xFFBBF7D0),
        );
      case 'pending':
        return (
          bg: const Color(0xFFFFFBEB),
          text: const Color(0xFFB45309),
          border: const Color(0xFFFDE68A),
        );
      case 'failed':
        return (
          bg: const Color(0xFFFEF2F2),
          text: const Color(0xFFB91C1C),
          border: const Color(0xFFFECACA),
        );
      default:
        return (
          bg: const Color(0xFFF9FAFB),
          text: const Color(0xFF374151),
          border: const Color(0xFFE5E7EB),
        );
    }
  }
}
