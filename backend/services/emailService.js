import { Resend } from 'resend'
import {
  BRAND_NAME,
  formatPasswordResetExpiryLabel,
  getFrontendUrl,
  getResendApiKey,
  getResendFrom,
  isEmailConfigured,
} from '../config/email.js'
import { SIGNED_URL_EXPIRY_SECONDS } from '../config/storage.js'

let resendClient = null

const getResendClient = () => {
  if (resendClient) return resendClient

  const apiKey = getResendApiKey()
  if (!apiKey) return null

  resendClient = new Resend(apiKey)
  return resendClient
}

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const LICENSE_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Video License</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">

  <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;padding:30px;">

    <h1 style="text-align:center;color:#111827;">
      ${BRAND_NAME}
    </h1>

    <h2>Thank You For Your Purchase!</h2>

    <p>Hi {{customer_name}},</p>

    <p>
      Your payment has been successfully processed and your licensed video
      is now ready for download.
    </p>

    <div style="background:#f9fafb;padding:20px;border-radius:8px;margin:20px 0;">
      <p><strong>Video Title:</strong> {{video_title}}</p>
      <p><strong>Clip ID:</strong> {{clip_id}}</p>
      <p><strong>License Number:</strong> {{license_number}}</p>
      <p><strong>Purchase Date:</strong> {{purchase_date}}</p>
    </div>

    {{download_section}}

    <p>
      Please keep this email for your records. Your license number serves
      as proof of purchase.
    </p>

    <p>
      If you have any questions, simply reply to this email.
    </p>

    <hr>

    <p style="font-size:12px;color:#666;text-align:center;">
      © {{current_year}} ${BRAND_NAME}. All rights reserved.
    </p>

  </div>

</body>
</html>`

const formatLinkExpiry = (fromDate = new Date()) => {
  const expiresAt = new Date(fromDate.getTime() + SIGNED_URL_EXPIRY_SECONDS * 1000)
  return expiresAt.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  })
}

const buildDownloadSection = (downloadUrl, linkExpiry) =>
  `<div style="text-align:center;margin:30px 0;">
      <a
        href="${downloadUrl}"
        style="
          background:#2563eb;
          color:white;
          text-decoration:none;
          padding:14px 24px;
          border-radius:6px;
          display:inline-block;
          font-weight:bold;
        "
      >
        Download Video
      </a>
      <p style="font-size:13px;color:#6b7280;margin-top:14px;line-height:1.5;">
        Download link valid until <strong style="color:#374151;">${escapeHtml(linkExpiry)}</strong> (IST)
      </p>
    </div>`

const fillLicenseEmailTemplate = ({
  customerName,
  videoTitle,
  clipId,
  licenseNumber,
  purchaseDate,
  downloadUrl,
  linkExpiry,
  currentYear,
}) =>
  LICENSE_EMAIL_TEMPLATE.replace(/{{customer_name}}/g, escapeHtml(customerName))
    .replace(/{{video_title}}/g, escapeHtml(videoTitle))
    .replace(/{{clip_id}}/g, escapeHtml(clipId))
    .replace(/{{license_number}}/g, escapeHtml(licenseNumber))
    .replace(/{{purchase_date}}/g, escapeHtml(purchaseDate))
    .replace(/{{download_section}}/g, buildDownloadSection(downloadUrl, linkExpiry))
    .replace(/{{current_year}}/g, String(currentYear))

const getPrimaryDownloadFile = (item) =>
  item.files?.find((file) => file.type === 'video') || item.files?.[0] || null

export const sendOrderLicenseEmail = async ({ order, downloads }) => {
  const customerEmail = order.billingAddress?.email?.trim()

  if (!customerEmail) {
    console.warn('[email] Skipped license email — no customer email on order')
    return { sent: false, reason: 'missing_email' }
  }

  const resend = getResendClient()
  if (!resend || !isEmailConfigured()) {
    console.warn('[email] Resend not configured — license email not sent')
    return { sent: false, reason: 'resend_not_configured' }
  }

  const purchaseDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const currentYear = new Date().getFullYear()
  const customerName = order.billingAddress?.name || 'there'

  if (!downloads?.length) {
    console.warn('[email] No order items to email')
    return { sent: false, reason: 'no_order_items' }
  }

  let sentCount = 0

  for (const item of downloads) {
    const downloadFile = getPrimaryDownloadFile(item)
    if (!downloadFile?.url) {
      console.warn(`[email] Skipped item "${item.name}" — no download URL available`)
      continue
    }

    const sentAt = new Date()
    const linkExpiry = formatLinkExpiry(sentAt)

    const html = fillLicenseEmailTemplate({
      customerName,
      videoTitle: item.name,
      clipId: item.clipId || '—',
      licenseNumber: item.licenseNumber || '—',
      purchaseDate,
      downloadUrl: downloadFile.url,
      linkExpiry,
      currentYear,
    })

    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to: customerEmail,
      subject: 'Your Video License & Download Link',
      html,
    })

    if (error) {
      console.error('[email] Resend API error:', error)
      throw new Error(error.message || 'Resend API error')
    }

    sentCount += 1
  }

  if (sentCount === 0) {
    console.warn('[email] No license emails sent — no downloadable files on order')
    return { sent: false, reason: 'no_download_files' }
  }

  console.log(`[email] License email sent to ${customerEmail} (${sentCount} item(s))`)
  return { sent: true, count: sentCount }
}

const PASSWORD_RESET_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reset your password</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
  <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;padding:30px;">
    <h1 style="text-align:center;color:#111827;">${BRAND_NAME}</h1>
    <h2>Reset your password</h2>
    <p>Hi {{customer_name}},</p>
    <p>We received a request to reset the password for your account. Click the button below to choose a new password.</p>
    <div style="text-align:center;margin:30px 0;">
      <a
        href="{{reset_url}}"
        style="background:#111827;color:white;text-decoration:none;padding:14px 24px;border-radius:6px;display:inline-block;font-weight:bold;"
      >
        Reset Password
      </a>
    </div>
    <p style="font-size:13px;color:#6b7280;line-height:1.5;">
      This link expires in <strong>{{expiry_label}}</strong>. If you did not request a password reset, you can safely ignore this email.
    </p>
    <hr>
    <p style="font-size:12px;color:#666;text-align:center;">
      © {{current_year}} ${BRAND_NAME}. All rights reserved.
    </p>
  </div>
</body>
</html>`

export const sendPasswordResetEmail = async ({ email, name, resetToken }) => {
  const resend = getResendClient()
  if (!resend || !isEmailConfigured()) {
    console.warn('[email] Resend not configured — password reset email not sent')
    return { sent: false, reason: 'resend_not_configured' }
  }

  const resetUrl = `${getFrontendUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`
  const currentYear = new Date().getFullYear()

  const html = PASSWORD_RESET_EMAIL_TEMPLATE.replace(/{{customer_name}}/g, escapeHtml(name || 'there'))
    .replace(/{{reset_url}}/g, escapeHtml(resetUrl))
    .replace(/{{expiry_label}}/g, escapeHtml(formatPasswordResetExpiryLabel()))
    .replace(/{{current_year}}/g, String(currentYear))

  const { error } = await resend.emails.send({
    from: getResendFrom(),
    to: email,
    subject: `Reset your ${BRAND_NAME} password`,
    html,
  })

  if (error) {
    console.error('[email] Resend API error:', error)
    throw new Error(error.message || 'Resend API error')
  }

  console.log(`[email] Password reset email sent to ${email}`)
  return { sent: true }
}

const SUPPORT_SUBJECT_LABELS = {
  download: 'Download issue',
  license_email: 'License email',
  payment: 'Payment',
  license: 'License',
  other: 'General inquiry',
}

const formatPlainTextAsHtml = (value = '') =>
  escapeHtml(value).replace(/\r?\n/g, '<br>')

const SUPPORT_REQUEST_RECEIVED_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Support request received</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
  <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;padding:30px;">
    <h1 style="text-align:center;color:#111827;">${BRAND_NAME}</h1>
    <h2 style="color:#111827;margin-bottom:8px;">We Have Received Your Request</h2>
    <p style="font-size:13px;color:#6b7280;margin-top:0;">Ticket <strong style="color:#374151;">{{ticket_number}}</strong></p>

    <p>Hi {{customer_name}},</p>

    <p>
      Thank you for reaching out to ${BRAND_NAME}. Your support request has been received successfully.
      Our team will review your issue and work to resolve it as quickly as possible.
    </p>

    <div style="background:#ecfdf5;border:1px solid #a7f3d0;padding:16px;border-radius:8px;margin:24px 0;">
      <p style="margin:0;color:#065f46;font-size:14px;line-height:1.6;">
        <strong>What happens next?</strong><br>
        A member of our support team will review your request and respond to you by email with an update or solution.
      </p>
    </div>

    <div style="background:#f9fafb;padding:20px;border-radius:8px;margin:20px 0;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Request summary</p>
      <p style="margin:0 0 8px;color:#374151;font-size:14px;"><strong>Issue type:</strong> {{issue_type}}</p>
      {{order_number_row}}
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;"><strong>Your message:</strong><br>{{original_message}}</p>
    </div>

    <p style="font-size:14px;color:#374151;line-height:1.6;">
      Please keep this email for your records. You can reply to this email if you have additional details to share.
    </p>

    <p style="font-size:13px;color:#6b7280;margin-top:24px;">
      Warm regards,<br>
      <strong style="color:#111827;">${BRAND_NAME} Support Team</strong>
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">

    <p style="font-size:12px;color:#666;text-align:center;">
      © {{current_year}} ${BRAND_NAME}. All rights reserved.
    </p>
  </div>
</body>
</html>`

export const sendSupportRequestConfirmationEmail = async (request) => {
  const customerEmail = request.email?.trim()

  if (!customerEmail) {
    console.warn('[email] Skipped support confirmation — no customer email on request')
    return { sent: false, reason: 'missing_email' }
  }

  const resend = getResendClient()
  if (!resend || !isEmailConfigured()) {
    console.warn('[email] Resend not configured — support confirmation email not sent')
    return { sent: false, reason: 'resend_not_configured' }
  }

  const currentYear = new Date().getFullYear()
  const issueType = SUPPORT_SUBJECT_LABELS[request.subject] || SUPPORT_SUBJECT_LABELS.other
  const orderNumberRow = request.orderNumber?.trim()
    ? `<p style="margin:0 0 8px;color:#374151;font-size:14px;"><strong>Order number:</strong> ${escapeHtml(request.orderNumber.trim())}</p>`
    : ''

  const html = SUPPORT_REQUEST_RECEIVED_EMAIL_TEMPLATE.replace(/{{ticket_number}}/g, escapeHtml(request.ticketNumber))
    .replace(/{{customer_name}}/g, escapeHtml(request.name || 'there'))
    .replace(/{{issue_type}}/g, escapeHtml(issueType))
    .replace(/{{order_number_row}}/g, orderNumberRow)
    .replace(/{{original_message}}/g, formatPlainTextAsHtml(request.message))
    .replace(/{{current_year}}/g, String(currentYear))

  const text = [
    `Hi ${request.name || 'there'},`,
    '',
    `Thank you for reaching out to ${BRAND_NAME}. Your support request has been received successfully.`,
    'Our team will review your issue and work to resolve it as quickly as possible.',
    '',
    `Ticket: ${request.ticketNumber}`,
    `Issue type: ${issueType}`,
    request.orderNumber?.trim() ? `Order number: ${request.orderNumber.trim()}` : '',
    '',
    'Your message:',
    request.message,
    '',
    `${BRAND_NAME} Support Team`,
  ]
    .filter(Boolean)
    .join('\n')

  const { error } = await resend.emails.send({
    from: getResendFrom(),
    to: customerEmail,
    subject: `Support request received — ${request.ticketNumber} — ${BRAND_NAME}`,
    html,
    text,
  })

  if (error) {
    console.error('[email] Resend API error (support confirmation):', error)
    throw new Error(error.message || 'Resend API error')
  }

  console.log(`[email] Support confirmation sent to ${customerEmail} (${request.ticketNumber})`)
  return { sent: true }
}

const SUPPORT_REPLY_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Support reply</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
  <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;padding:30px;">
    <h1 style="text-align:center;color:#111827;">${BRAND_NAME}</h1>
    <h2 style="color:#111827;margin-bottom:8px;">Support Team Response</h2>
    <p style="font-size:13px;color:#6b7280;margin-top:0;">Ticket <strong style="color:#374151;">{{ticket_number}}</strong></p>

    <p>Hi {{customer_name}},</p>

    <p>
      Thank you for contacting ${BRAND_NAME} support regarding
      <strong>{{issue_type}}</strong>. We have reviewed your request and our team has shared the following update:
    </p>

    <div style="background:#f9fafb;border-left:4px solid #111827;padding:20px;border-radius:8px;margin:24px 0;">
      <p style="margin:0;color:#111827;line-height:1.7;white-space:normal;">{{reply_message}}</p>
    </div>

    <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:bold;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;">Your original message</p>
      <p style="margin:0;color:#374151;line-height:1.6;font-size:14px;">{{original_message}}</p>
    </div>

    <p style="font-size:14px;color:#374151;line-height:1.6;">
      If you need further assistance, reply to this email or visit our
      <a href="{{support_url}}" style="color:#111827;font-weight:bold;">support page</a>.
    </p>

    <p style="font-size:13px;color:#6b7280;margin-top:24px;">
      Warm regards,<br>
      <strong style="color:#111827;">${BRAND_NAME} Support Team</strong>
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;">

    <p style="font-size:12px;color:#666;text-align:center;">
      © {{current_year}} ${BRAND_NAME}. All rights reserved.
    </p>
  </div>
</body>
</html>`

export const sendSupportReplyEmail = async ({ request, replyMessage }) => {
  const customerEmail = request.email?.trim()

  if (!customerEmail) {
    console.warn('[email] Skipped support reply — no customer email on request')
    return { sent: false, reason: 'missing_email' }
  }

  const resend = getResendClient()
  if (!resend || !isEmailConfigured()) {
    console.warn('[email] Resend not configured — support reply email not sent')
    return { sent: false, reason: 'resend_not_configured' }
  }

  const currentYear = new Date().getFullYear()
  const issueType = SUPPORT_SUBJECT_LABELS[request.subject] || SUPPORT_SUBJECT_LABELS.other
  const supportUrl = `${getFrontendUrl()}/support`

  const html = SUPPORT_REPLY_EMAIL_TEMPLATE.replace(/{{ticket_number}}/g, escapeHtml(request.ticketNumber))
    .replace(/{{customer_name}}/g, escapeHtml(request.name || 'there'))
    .replace(/{{issue_type}}/g, escapeHtml(issueType))
    .replace(/{{reply_message}}/g, formatPlainTextAsHtml(replyMessage))
    .replace(/{{original_message}}/g, formatPlainTextAsHtml(request.message))
    .replace(/{{support_url}}/g, escapeHtml(supportUrl))
    .replace(/{{current_year}}/g, String(currentYear))

  const { error } = await resend.emails.send({
    from: getResendFrom(),
    to: customerEmail,
    subject: `Re: Support request ${request.ticketNumber} — ${BRAND_NAME}`,
    html,
  })

  if (error) {
    console.error('[email] Resend API error:', error)
    throw new Error(error.message || 'Resend API error')
  }

  console.log(`[email] Support reply sent to ${customerEmail} (${request.ticketNumber})`)
  return { sent: true }
}
