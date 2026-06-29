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
import {
  buildLicenseCertificateBuffer,
  getLicenseCertificateFilename,
} from './licenseCertificateService.js'

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

const formatPlainTextAsHtml = (value = '') =>
  escapeHtml(value).replace(/\r?\n/g, '<br>')

const wrapBrandEmail = ({ title, bodyHtml, currentYear }) => `<!DOCTYPE html>
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

const brandParagraph = (html) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:#111827;">${html}</p>`

const brandSectionLabel = (label) =>
  `<p style="margin:24px 0 8px;font-size:13px;font-weight:600;color:#111827;letter-spacing:0.04em;text-transform:uppercase;">${label}</p>`

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

const brandDownloadButton = (href, label = 'Download Your Licensed Video') => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
    <tr>
      <td align="center" style="border-radius:8px;background:#2563eb;">
        <a
          href="${escapeHtml(href)}"
          style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:8px;background:#2563eb;"
        >
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`

const buildDownloadSection = (downloadUrl, linkExpiry) => `
  ${brandSectionLabel('Download your video')}
  ${brandDownloadButton(downloadUrl)}
  ${brandParagraph(
    `This download link is valid until <strong>${escapeHtml(linkExpiry)}</strong> (IST).`,
  )}
`

const buildOrderItemsSection = (orderItems, linkExpiry) =>
  orderItems
    .map(
      ({ item, downloadUrl }) => `
  ${brandParagraph(`<strong>${escapeHtml(item.name)}</strong>`)}
  ${brandParagraph(
    `Clip ID: ${escapeHtml(item.clipId || '—')} · License number: ${escapeHtml(item.licenseNumber || '—')}`,
  )}
  ${buildDownloadSection(downloadUrl, linkExpiry)}
`,
    )
    .join('')

const buildLicenseEmailBody = ({
  customerName,
  purchaseDate,
  orderItems,
  linkExpiry,
}) => `
  <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;line-height:1.3;color:#111827;">Thank You For Your Purchase</h1>
  ${brandParagraph(`Hi ${customerName},`)}
  ${brandParagraph(
    `Your payment has been successfully processed and your licensed video${orderItems.length > 1 ? 's are' : ' is'} now ready for download.`,
  )}
  ${brandSectionLabel('Purchase details')}
  ${brandParagraph(`<strong>Purchase date:</strong> ${purchaseDate}`)}
  ${buildOrderItemsSection(orderItems, linkExpiry)}
  ${brandSectionLabel('Attached document')}
  ${brandParagraph(
    '<strong>License Certificate</strong> — proof of purchase, license details, and editorial usage terms.',
  )}
  ${brandParagraph(
    `Please keep this email and the attached certificate for your records.`,
  )}
  ${brandParagraph(`If you have any questions, simply reply to this email.`)}
  ${brandParagraph(`Warm regards,<br><strong>${BRAND_NAME} Team</strong>`)}
`

const buildLicenseEmailHtml = ({
  customerName,
  purchaseDate,
  orderItems,
  linkExpiry,
  currentYear,
}) =>
  wrapBrandEmail({
    title: 'Your Video License & Download Link',
    currentYear,
    bodyHtml: buildLicenseEmailBody({
      customerName: escapeHtml(customerName),
      purchaseDate: escapeHtml(purchaseDate),
      orderItems: orderItems.map(({ item, downloadUrl }) => ({
        item,
        downloadUrl,
      })),
      linkExpiry,
    }),
  })

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

  const orderItems = []

  for (const item of downloads) {
    const downloadFile = getPrimaryDownloadFile(item)
    if (!downloadFile?.url) {
      console.warn(`[email] Skipped item "${item.name}" — no download URL available`)
      continue
    }

    orderItems.push({ item, downloadUrl: downloadFile.url })
  }

  if (orderItems.length === 0) {
    console.warn('[email] No license emails sent — no downloadable files on order')
    return { sent: false, reason: 'no_download_files' }
  }

  const sentAt = new Date()
  const linkExpiry = formatLinkExpiry(sentAt)
  const certificateBuffer = buildLicenseCertificateBuffer(order, downloads)
  const certificateFilename = getLicenseCertificateFilename(order)

  const html = buildLicenseEmailHtml({
    customerName,
    purchaseDate,
    orderItems,
    linkExpiry,
    currentYear,
  })

  const textSections = orderItems.flatMap(({ item, downloadUrl }) => [
    '',
    `Video title: ${item.name}`,
    `Clip ID: ${item.clipId || '—'}`,
    `License number: ${item.licenseNumber || '—'}`,
    `Download link: ${downloadUrl}`,
    `Link valid until: ${linkExpiry} (IST)`,
  ])

  const text = [
    `Hi ${customerName},`,
    '',
    `Your payment has been successfully processed and your licensed video${orderItems.length > 1 ? 's are' : ' is'} now ready for download.`,
    '',
    `Purchase date: ${purchaseDate}`,
    ...textSections,
    '',
    'Attached document:',
    certificateFilename,
    '',
    `${BRAND_NAME} Team`,
  ].join('\n')

  const attachments = [
    {
      filename: certificateFilename,
      content: certificateBuffer.toString('base64'),
    },
  ]

  const { error } = await resend.emails.send({
    from: getResendFrom(),
    to: customerEmail,
    subject: 'Your Video License & Download Link',
    html,
    text,
    attachments,
  })

  if (error) {
    console.error('[email] Resend API error:', error)
    throw new Error(error.message || 'Resend API error')
  }

  console.log(
    `[email] License email sent to ${customerEmail} (${orderItems.length} item(s), license certificate attached)`,
  )
  return { sent: true, count: 1, items: orderItems.length }
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

const buildSupportConfirmationBody = ({
  customerName,
  ticketNumber,
  issueType,
  orderNumberRow,
  originalMessage,
}) => `
  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;line-height:1.3;color:#111827;">We Have Received Your Request</h1>
  <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#4b5563;">Ticket <strong style="color:#111827;">${ticketNumber}</strong></p>
  ${brandParagraph(`Hi ${customerName},`)}
  ${brandParagraph(
    `Thank you for reaching out to ${BRAND_NAME}. Your support request has been received successfully. Our team will review your issue and work to resolve it as quickly as possible.`,
  )}
  ${brandParagraph(
    '<strong>What happens next?</strong><br>A member of our support team will review your request and respond to you by email with an update or solution.',
  )}
  ${brandSectionLabel('Request summary')}
  ${brandParagraph(`<strong>Issue type:</strong> ${issueType}`)}
  ${orderNumberRow}
  ${brandParagraph(`<strong>Your message:</strong><br>${originalMessage}`)}
  ${brandParagraph(
    'Please keep this email for your records. You can reply to this email if you have additional details to share.',
  )}
  ${brandParagraph(
    `Warm regards,<br><strong>${BRAND_NAME} Support Team</strong>`,
  )}
`

const buildSupportReplyBody = ({
  customerName,
  ticketNumber,
  issueType,
  replyMessage,
  originalMessage,
}) => `
  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;line-height:1.3;color:#111827;">Support Team Response</h1>
  <p style="margin:0 0 24px;font-size:14px;line-height:1.5;color:#4b5563;">Ticket <strong style="color:#111827;">${ticketNumber}</strong></p>
  ${brandParagraph(`Hi ${customerName},`)}
  ${brandParagraph(
    `Thank you for contacting ${BRAND_NAME} support regarding <strong>${issueType}</strong>. We have reviewed your request and our team has shared the following update:`,
  )}
  ${brandParagraph(replyMessage)}
  ${brandSectionLabel('Your original message')}
  ${brandParagraph(originalMessage)}
  ${brandParagraph(
    'If you need further assistance, reply to this email.',
  )}
  ${brandParagraph(
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
    ? brandParagraph(
        `<strong>Order number:</strong> ${escapeHtml(request.orderNumber.trim())}`,
      )
    : ''

  const html = wrapBrandEmail({
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

export const sendSupportReplyEmail = async ({ request, replyMessage, emailBody }) => {
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
  const customBody = emailBody?.trim()

  let html
  let text

  if (customBody) {
    text = customBody
    html = wrapBrandEmail({
      title: 'Support reply',
      currentYear,
      bodyHtml: customBody
        .split(/\n\n+/)
        .filter(Boolean)
        .map((block) => brandParagraph(formatPlainTextAsHtml(block)))
        .join(''),
    })
  } else {
    const message = replyMessage?.trim() || ''

    html = wrapBrandEmail({
      title: 'Support reply',
      currentYear,
      bodyHtml: buildSupportReplyBody({
        customerName: escapeHtml(request.name || 'there'),
        ticketNumber: escapeHtml(request.ticketNumber),
        issueType: escapeHtml(issueType),
        replyMessage: formatPlainTextAsHtml(message),
        originalMessage: formatPlainTextAsHtml(request.message),
      }),
    })

    text = [
      `Hi ${request.name || 'there'},`,
      '',
      `Thank you for contacting ${BRAND_NAME} support regarding ${issueType}.`,
      '',
      message,
      '',
      'Your original message:',
      request.message,
      '',
      `${BRAND_NAME} Support Team`,
    ].join('\n')
  }

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
