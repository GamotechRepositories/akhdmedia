String buildInternationalPhone({
  required String dialCode,
  required String nationalNumber,
}) {
  final codeDigits = dialCode.replaceAll(RegExp(r'\D'), '');
  var national = nationalNumber.replaceAll(RegExp(r'\D'), '');
  if (national.startsWith('0')) {
    national = national.substring(1);
  }
  if (codeDigits.isEmpty || national.isEmpty) return '';
  return '+$codeDigits$national';
}

String normalizePhoneValue(String value, {String defaultDialCode = '91'}) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) return '';

  if (trimmed.startsWith('+')) return trimmed;

  final digits = trimmed.replaceAll(RegExp(r'\D'), '');
  if (digits.length == 10) return '+$defaultDialCode$digits';
  if (digits.length == 12 && digits.startsWith('91')) return '+$digits';

  return trimmed;
}

bool isPhoneNumberValid(String value) {
  final normalized = normalizePhoneValue(value);
  if (normalized.isEmpty) return false;

  final digits = normalized.replaceAll(RegExp(r'\D'), '');
  return digits.length >= 10 && digits.length <= 15;
}
