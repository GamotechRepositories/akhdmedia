export const MAX_LICENSE_EMAIL_RESENDS = 2;

export const LICENSE_EMAIL_RESEND_WINDOW_MS = 5 * 60 * 1000;

export const LICENSE_EMAIL_RESEND_LIMIT_MESSAGE =
  'You have reached the maximum number of resend attempts. Please contact our support team for help.';

export const LICENSE_EMAIL_RESEND_WINDOW_EXPIRED_MESSAGE =
  'The resend period has ended. Resend is only available within 5 minutes of your order. Please contact support if you need help.';

export const formatResendWindowLabel = (remainingMs) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }

  return `${seconds}s`;
};
