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

const wrapSupportEmail = ({ title, bodyHtml, currentYear }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#111827;-webkit-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:720px;">
          <tr>
            <td style="padding:28px 24px 20px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:17px;font-weight:700;letter-spacing:0.03em;color:#111827;">${BRAND_NAME}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 32px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 24px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;text-align:center;">
                © ${currentYear} ${BRAND_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

const supportParagraph = (html) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:#111827;">${html}</p>`

const supportSectionLabel = (label) =>
  `<p style="margin:24px 0 8px;font-size:13px;font-weight:600;color:#111827;letter-spacing:0.04em;text-transform:uppercase;">${label}</p>`

const buildSupportConfirmationBody = ({
  customerName,
  ticketNumber,
  issueType,
  orderNumberRow,
  originalMessage,
}) => `
  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;line-height:1.3;color:#111827;">We Have Received Your Request</h1>
  <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#4b5563;">Ticket <strong style="color:#111827;">${ticketNumber}</strong></p>
  ${supportParagraph(`Hi ${customerName},`)}
  ${supportParagraph(
    `Thank you for reaching out to ${BRAND_NAME}. Your support request has been received successfully. Our team will review your issue and work to resolve it as quickly as possible.`,
  )}
  ${supportParagraph(
    '<strong>What happens next?</strong><br>A member of our support team will review your request and respond to you by email with an update or solution.',
  )}
  ${supportSectionLabel('Request summary')}
  ${supportParagraph(`<strong>Issue type:</strong> ${issueType}`)}
  ${orderNumberRow}
  ${supportParagraph(`<strong>Your message:</strong><br>${originalMessage}`)}
  ${supportParagraph(
    'Please keep this email for your records. You can reply to this email if you have additional details to share.',
  )}
  ${supportParagraph(
    `Warm regards,<br><strong>${BRAND_NAME} Support Team</strong>`,
  )}
`

const buildSupportReplyBody = ({
  customerName,
  ticketNumber,
  issueType,
  replyMessage,
  originalMessage,
  supportUrl,
}) => `
  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;line-height:1.3;color:#111827;">Support Team Response</h1>
  <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#4b5563;">Ticket <strong style="color:#111827;">${ticketNumber}</strong></p>
  ${supportParagraph(`Hi ${customerName},`)}
  ${supportParagraph(
    `Thank you for contacting ${BRAND_NAME} support regarding <strong>${issueType}</strong>. We have reviewed your request and our team has shared the following update:`,
  )}
  ${supportParagraph(replyMessage)}
  ${supportSectionLabel('Your original message')}
  ${supportParagraph(originalMessage)}
  ${supportParagraph(
    `If you need further assistance, reply to this email or visit our <a href="${supportUrl}" style="color:#111827;text-decoration:underline;">support page</a>.`,
  )}
  ${supportParagraph(
    `Warm regards,<br><strong>${BRAND_NAME} Support Team</strong>`,
  )}
`

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
    ? supportParagraph(
        `<strong>Order number:</strong> ${escapeHtml(request.orderNumber.trim())}`,
      )
    : ''

  const html = wrapSupportEmail({
    title: 'Support request received',
    currentYear,
    bodyHtml: buildSupportConfirmationBody({
      customerName: escapeHtml(request.name || 'there'),
      ticketNumber: escapeHtml(request.ticketNumber),
      issueType: escapeHtml(issueType),
      orderNumberRow,
      originalMessage: formatPlainTextAsHtml(request.message),
    }),
  })

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

  const html = wrapSupportEmail({
    title: 'Support reply',
    currentYear,
    bodyHtml: buildSupportReplyBody({
      customerName: escapeHtml(request.name || 'there'),
      ticketNumber: escapeHtml(request.ticketNumber),
      issueType: escapeHtml(issueType),
      replyMessage: formatPlainTextAsHtml(replyMessage),
      originalMessage: formatPlainTextAsHtml(request.message),
      supportUrl: escapeHtml(supportUrl),
    }),
  })

  const text = [
    `Hi ${request.name || 'there'},`,
    '',
    `Thank you for contacting ${BRAND_NAME} support regarding ${issueType}.`,
    '',
    replyMessage,
    '',
    'Your original message:',
    request.message,
    '',
    `${BRAND_NAME} Support Team`,
  ].join('\n')

  const { error } = await resend.emails.send({
    from: getResendFrom(),
    to: customerEmail,
    subject: `Re: Support request ${request.ticketNumber} — ${BRAND_NAME}`,
    html,
    text,
  })

  if (error) {
    console.error('[email] Resend API error:', error)
    throw new Error(error.message || 'Resend API error')
  }

  console.log(`[email] Support reply sent to ${customerEmail} (${request.ticketNumber})`)
  return { sent: true }
}
