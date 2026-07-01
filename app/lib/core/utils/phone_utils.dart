String normalizePhoneValue(String value) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) return '';

  if (trimmed.startsWith('+')) return trimmed;

  final digits = trimmed.replaceAll(RegExp(r'\D'), '');
  if (digits.length == 10) return '+91$digits';
  if (digits.length == 12 && digits.startsWith('91')) return '+$digits';

  return trimmed;
}

bool isPhoneNumberValid(String value) {
  final normalized = normalizePhoneValue(value);
  if (normalized.isEmpty) return false;

  final digits = normalized.replaceAll(RegExp(r'\D'), '');
  return digits.length >= 10 && digits.length <= 15;
}
