class EmailConstants {
  static const maxLicenseEmailResends = 2;
  static const licenseEmailResendWindowMs = 5 * 60 * 1000;

  static const licenseEmailResendLimitMessage =
      'You have reached the maximum number of resend attempts. Please contact our support team for help.';

  static const licenseEmailResendWindowExpiredMessage =
      'The resend period has ended. Resend is only available within 5 minutes of your order. Please contact support if you need help.';

  static String formatResendWindowLabel(int remainingMs) {
    final totalSeconds = (remainingMs / 1000).ceil().clamp(0, 999999);
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;

    if (minutes > 0) {
      return '${minutes}m ${seconds.toString().padLeft(2, '0')}s';
    }
    return '${seconds}s';
  }
}
