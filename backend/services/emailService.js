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
import {
  buildSubscriptionCertificateBuffer,
  getSubscriptionCertificateFilename,
} from './subscriptionCertificateService.js'

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

export const formatLinkExpiry = (fromDate = new Date()) => {
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
  <title>{{email_title}}</title>
</head>
<body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:20px;">
  <div style="max-width:600px;margin:auto;background:#ffffff;border-radius:10px;padding:30px;">
    <h1 style="text-align:center;color:#111827;">${BRAND_NAME}</h1>
    <h2>{{email_heading}}</h2>
    <p>Hi {{customer_name}},</p>
    <p>{{email_body}}</p>
    <div style="text-align:center;margin:30px 0;">
      <a
        href="{{reset_url}}"
        style="background:#111827;color:white;text-decoration:none;padding:14px 24px;border-radius:6px;display:inline-block;font-weight:bold;"
      >
        {{cta_label}}
      </a>
    </div>
    <p style="font-size:13px;color:#6b7280;line-height:1.5;">
      This link expires in <strong>{{expiry_label}}</strong>. If you did not request this, you can safely ignore this email.
    </p>
    <hr>
    <p style="font-size:12px;color:#666;text-align:center;">
      © {{current_year}} ${BRAND_NAME}. All rights reserved.
    </p>
  </div>
</body>
</html>`

export const sendPasswordResetEmail = async ({
  email,
  name,
  resetToken,
  isSettingPassword = false,
}) => {
  const resend = getResendClient()
  if (!resend || !isEmailConfigured()) {
    console.warn('[email] Resend not configured — password reset email not sent')
    return { sent: false, reason: 'resend_not_configured' }
  }

  const resetUrl = `${getFrontendUrl()}/reset-password?token=${encodeURIComponent(resetToken)}`
  const currentYear = new Date().getFullYear()
  const emailTitle = isSettingPassword ? 'Set your password' : 'Reset your password'
  const emailHeading = isSettingPassword ? 'Set a password' : 'Reset your password'
  const emailBody = isSettingPassword
    ? 'Your account was created with Google sign-in. Click the button below to set a password so you can also sign in with email.'
    : 'We received a request to reset the password for your account. Click the button below to choose a new password.'
  const ctaLabel = isSettingPassword ? 'Set Password' : 'Reset Password'
  const subject = isSettingPassword
    ? `Set your ${BRAND_NAME} password`
    : `Reset your ${BRAND_NAME} password`

  const html = PASSWORD_RESET_EMAIL_TEMPLATE.replace(/{{email_title}}/g, escapeHtml(emailTitle))
    .replace(/{{email_heading}}/g, escapeHtml(emailHeading))
    .replace(/{{email_body}}/g, escapeHtml(emailBody))
    .replace(/{{cta_label}}/g, escapeHtml(ctaLabel))
    .replace(/{{customer_name}}/g, escapeHtml(name || 'there'))
    .replace(/{{reset_url}}/g, escapeHtml(resetUrl))
    .replace(/{{expiry_label}}/g, escapeHtml(formatPasswordResetExpiryLabel()))
    .replace(/{{current_year}}/g, String(currentYear))

  const { error } = await resend.emails.send({
    from: getResendFrom(),
    to: email,
    subject,
    html,
  })

  if (error) {
    console.error('[email] Resend API error:', error)
    throw new Error(error.message || 'Resend API error')
  }

  console.log(`[email] Password reset email sent to ${email}`)
  return { sent: true }
}

export const sendAccountDeletionCodeEmail = async ({
  email,
  name,
  code,
  expiryMinutes = 10,
}) => {
  const resend = getResendClient()
  if (!resend || !isEmailConfigured()) {
    console.warn('[email] Resend not configured — account deletion code not sent')
    return { sent: false, reason: 'resend_not_configured' }
  }

  const currentYear = new Date().getFullYear()
  const safeName = escapeHtml(name || 'there')
  const safeCode = escapeHtml(String(code))
  const expiryLabel = formatPasswordResetExpiryLabel(expiryMinutes)

  const html = wrapBrandEmail({
    title: 'Confirm account deletion',
    currentYear,
    bodyHtml: `
      <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;line-height:1.3;color:#111827;">Confirm account deletion</h1>
      ${brandParagraph(`Hi ${safeName},`)}
      ${brandParagraph(
        `We received a request to permanently delete your ${BRAND_NAME} account. Use the confirmation code below to complete this request.`,
      )}
      <p style="margin:24px 0;font-size:32px;font-weight:700;letter-spacing:0.35em;text-align:center;color:#111827;">${safeCode}</p>
      ${brandParagraph(
        `This code expires in <strong>${escapeHtml(expiryLabel)}</strong>. If you did not request account deletion, you can safely ignore this email and your account will remain active.`,
      )}
      ${brandParagraph(`Warm regards,<br><strong>${BRAND_NAME} Team</strong>`)}
    `,
  })

  const text = [
    `Hi ${name || 'there'},`,
    '',
    `We received a request to permanently delete your ${BRAND_NAME} account.`,
    `Your confirmation code is: ${code}`,
    `This code expires in ${expiryLabel}.`,
    '',
    'If you did not request this, ignore this email.',
    '',
    `${BRAND_NAME} Team`,
  ].join('\n')

  const { error } = await resend.emails.send({
    from: getResendFrom(),
    to: email,
    subject: `Confirm account deletion — ${BRAND_NAME}`,
    html,
    text,
  })

  if (error) {
    console.error('[email] Resend API error (account deletion):', error)
    throw new Error(error.message || 'Resend API error')
  }

  console.log(`[email] Account deletion code sent to ${email}`)
  return { sent: true }
}

export const sendRegistrationOtpEmail = async ({
  email,
  name,
  code,
  expiryMinutes = 10,
}) => {
  const resend = getResendClient()
  if (!resend || !isEmailConfigured()) {
    console.warn('[email] Resend not configured — registration OTP not sent')
    return { sent: false, reason: 'resend_not_configured' }
  }

  const currentYear = new Date().getFullYear()
  const safeName = escapeHtml(name || 'there')
  const safeCode = escapeHtml(String(code))
  const expiryLabel = formatPasswordResetExpiryLabel(expiryMinutes)

  const html = wrapBrandEmail({
    title: 'Verify your email',
    currentYear,
    bodyHtml: `
      <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;line-height:1.3;color:#111827;">Verify your email</h1>
      ${brandParagraph(`Hi ${safeName},`)}
      ${brandParagraph(
        `Use the one-time code below to verify your email and finish creating your ${BRAND_NAME} account.`,
      )}
      <p style="margin:24px 0;font-size:32px;font-weight:700;letter-spacing:0.35em;text-align:center;color:#111827;">${safeCode}</p>
      ${brandParagraph(
        `This code expires in <strong>${escapeHtml(expiryLabel)}</strong>. If you did not try to create an account, you can safely ignore this email.`,
      )}
      ${brandParagraph(`Warm regards,<br><strong>${BRAND_NAME} Team</strong>`)}
    `,
  })

  const text = [
    `Hi ${name || 'there'},`,
    '',
    `Your ${BRAND_NAME} verification code is: ${code}`,
    `This code expires in ${expiryLabel}.`,
    '',
    'If you did not request this, ignore this email.',
    '',
    `${BRAND_NAME} Team`,
  ].join('\n')

  const { error } = await resend.emails.send({
    from: getResendFrom(),
    to: email,
    subject: `Verify your email — ${BRAND_NAME}`,
    html,
    text,
  })

  if (error) {
    console.error('[email] Resend API error (registration OTP):', error)
    throw new Error(error.message || 'Resend API error')
  }

  console.log(`[email] Registration OTP sent to ${email}`)
  return { sent: true }
}

export const sendPasswordResetOtpEmail = async ({
  email,
  name,
  code,
  expiryMinutes = 10,
  isSettingPassword = false,
}) => {
  const resend = getResendClient()
  if (!resend || !isEmailConfigured()) {
    console.warn('[email] Resend not configured — password reset OTP not sent')
    return { sent: false, reason: 'resend_not_configured' }
  }

  const currentYear = new Date().getFullYear()
  const safeName = escapeHtml(name || 'there')
  const safeCode = escapeHtml(String(code))
  const expiryLabel = formatPasswordResetExpiryLabel(expiryMinutes)
  const heading = isSettingPassword ? 'Set your password' : 'Reset your password'
  const intro = isSettingPassword
    ? `Your account was created with Google sign-in. Use the one-time code below to set a password so you can also sign in with email.`
    : `Use the one-time code below to reset the password for your ${BRAND_NAME} account.`

  const html = wrapBrandEmail({
    title: heading,
    currentYear,
    bodyHtml: `
      <h1 style="margin:0 0 24px;font-size:22px;font-weight:700;line-height:1.3;color:#111827;">${escapeHtml(heading)}</h1>
      ${brandParagraph(`Hi ${safeName},`)}
      ${brandParagraph(intro)}
      <p style="margin:24px 0;font-size:32px;font-weight:700;letter-spacing:0.35em;text-align:center;color:#111827;">${safeCode}</p>
      ${brandParagraph(
        `This code expires in <strong>${escapeHtml(expiryLabel)}</strong>. If you did not request this, you can safely ignore this email.`,
      )}
      ${brandParagraph(`Warm regards,<br><strong>${BRAND_NAME} Team</strong>`)}
    `,
  })

  const text = [
    `Hi ${name || 'there'},`,
    '',
    intro.replace(/<[^>]+>/g, ''),
    '',
    `Your code: ${code}`,
    `This code expires in ${expiryLabel}.`,
    '',
    'If you did not request this, ignore this email.',
    '',
    `${BRAND_NAME} Team`,
  ].join('\n')

  const { error } = await resend.emails.send({
    from: getResendFrom(),
    to: email,
    subject: `${heading} — ${BRAND_NAME}`,
    html,
    text,
  })

  if (error) {
    console.error('[email] Resend API error (password reset OTP):', error)
    throw new Error(error.message || 'Resend API error')
  }

  console.log(`[email] Password reset OTP sent to ${email}`)
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

const chunkArray = (values = [], chunkSize = 25) => {
  const chunks = []
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize))
  }
  return chunks
}

const normalizeRecipients = (recipients = []) =>
  [...new Set(recipients.map((email) => String(email || '').trim().toLowerCase()).filter(Boolean))]

export const sendAdminBroadcastEmail = async ({
  recipients = [],
  subject = '',
  message = '',
  title = '',
  from = '',
  attachments = [],
}) => {
  const resend = getResendClient()
  if (!resend || !isEmailConfigured()) {
    console.warn('[email] Resend not configured — broadcast email not sent')
    return { sent: false, reason: 'resend_not_configured' }
  }

  const normalizedRecipients = normalizeRecipients(recipients)
  if (!normalizedRecipients.length) {
    return { sent: false, reason: 'missing_recipients' }
  }

  const trimmedSubject = subject.trim()
  const trimmedMessage = message.trim()
  if (!trimmedSubject || !trimmedMessage) {
    return { sent: false, reason: 'missing_subject_or_message' }
  }

  const fromAddress = from?.trim() || getResendFrom()

  const currentYear = new Date().getFullYear()
  const safeTitle = title?.trim() || trimmedSubject
  const html = wrapBrandEmail({
    title: safeTitle,
    currentYear,
    bodyHtml: trimmedMessage
      .split(/\n\n+/)
      .filter(Boolean)
      .map((block) => brandParagraph(formatPlainTextAsHtml(block)))
      .join(''),
  })

  const batches = chunkArray(normalizedRecipients, 25)
  let sentCount = 0
  const failed = []
  const resendAttachments = attachments.length
    ? attachments.map((item) => ({
        filename: item.filename,
        content: item.content,
      }))
    : undefined

  for (const batch of batches) {
    const results = await Promise.allSettled(
      batch.map((recipient) =>
        resend.emails.send({
          from: fromAddress,
          to: recipient,
          subject: trimmedSubject,
          html,
          text: trimmedMessage,
          ...(resendAttachments?.length ? { attachments: resendAttachments } : {}),
        }),
      ),
    )

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && !result.value?.error) {
        sentCount += 1
        return
      }

      const recipient = batch[index]
      if (result.status === 'fulfilled') {
        failed.push({ email: recipient, error: result.value?.error?.message || 'Unknown error' })
        return
      }
      failed.push({ email: recipient, error: result.reason?.message || 'Unknown error' })
    })
  }

  console.log(
    `[email] Broadcast send completed: sent=${sentCount}, failed=${failed.length}, total=${normalizedRecipients.length}`,
  )

  return {
    sent: sentCount > 0,
    total: normalizedRecipients.length,
    sentCount,
    failedCount: failed.length,
    failed,
  }
}


export const sendSubscriptionConfirmationEmail = async ({ user, subscription, plan }) => {
  const customerEmail = user?.email?.trim()
  if (!customerEmail) {
    console.warn('[email] Skipped subscription email — no customer email')
    return { sent: false, reason: 'missing_email' }
  }

  const resend = getResendClient()
  if (!resend || !isEmailConfigured()) {
    console.warn('[email] Resend not configured — subscription email not sent')
    return { sent: false, reason: 'resend_not_configured' }
  }

  const customerName = user?.name || 'Valued Subscriber'
  const planName = plan?.name || subscription?.planSnapshot?.name || 'Editorial Video Plan'
  const interval = (plan?.interval || subscription?.planSnapshot?.interval || 'monthly').toUpperCase()
  const currentYear = new Date().getFullYear()

  const subtotal = Number(subscription?.subtotal || subscription?.planSnapshot?.subtotal || subscription?.price || 0)
  const gstPercentage = Number(subscription?.gstPercentage || subscription?.planSnapshot?.gstPercentage || 0)
  const gstAmount = Number(subscription?.gstAmount || subscription?.planSnapshot?.gstAmount || 0)
  const totalAmount = Number(subscription?.totalAmount || subscription?.amountPaid || (subtotal + gstAmount))

  const purchaseDate = new Date(subscription?.startDate || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const expiryDate = new Date(subscription?.endDate || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const whatsappNumber = subscription?.whatsappNumber || user?.phone || 'Provided Number'
  const txnId = subscription?.razorpayPaymentId || subscription?.razorpaySubscriptionId || subscription?._id?.toString() || '—'
  const videoQuota = subscription?.videoQuota || plan?.videoQuota || 20

  let invoiceBuffer = null
  let invoiceFilename = 'subscription-tax-invoice.pdf'
  try {
    const plainSub = subscription?.toObject ? subscription.toObject() : (subscription || {})
    const subForPdf = {
      ...plainSub,
      _id: subscription?._id || plainSub._id,
      planSnapshot: plainSub.planSnapshot || {
        name: planName,
        interval: interval.toLowerCase(),
        videoQuota,
        subtotal,
        gstPercentage,
        gstAmount,
        totalPayable: totalAmount,
        customerName,
      },
      videoQuota: plainSub.videoQuota ?? videoQuota,
      subtotal: plainSub.subtotal ?? subtotal,
      gstAmount: plainSub.gstAmount ?? gstAmount,
      totalAmount: plainSub.totalAmount ?? totalAmount,
      gstPercentage: plainSub.gstPercentage ?? gstPercentage,
      startDate: plainSub.startDate || subscription?.startDate || new Date(),
      endDate: plainSub.endDate || subscription?.endDate,
      whatsappNumber: plainSub.whatsappNumber || whatsappNumber,
      razorpayPaymentId: plainSub.razorpayPaymentId || subscription?.razorpayPaymentId,
      razorpaySubscriptionId: plainSub.razorpaySubscriptionId || subscription?.razorpaySubscriptionId,
      paymentProvider: plainSub.paymentProvider || subscription?.paymentProvider,
    }
    invoiceFilename = getSubscriptionCertificateFilename(subForPdf)
    invoiceBuffer = buildSubscriptionCertificateBuffer(subForPdf, user)
  } catch (pdfErr) {
    console.error('[email] Failed generating subscription invoice PDF for attachment:', pdfErr.message)
  }

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111827;">
      Subscription Confirmed &amp; Payment Received!
    </h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#374151;">
      Hi ${escapeHtml(customerName)},
    </p>

    <!-- WhatsApp Group Alert Banner -->
    <div style="margin:0 0 24px;padding:18px 20px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;">
      <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#065f46;">
        💬 WhatsApp Group Activation in Progress
      </p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#047857;">
        <strong>We have successfully received your payment.</strong> In the next few hours a separate WhatsApp group will be created for you where you will keep getting all the 4K UHD videos on a daily basis.
      </p>
      <p style="margin:12px 0 0;font-size:13px;color:#065f46;">
        Registered WhatsApp Mobile Number: <strong style="font-family:monospace;font-size:14px;">${escapeHtml(whatsappNumber)}</strong>
      </p>
    </div>

    <!-- Bill / Tax Receipt Breakdown -->
    <p style="margin:24px 0 10px;font-size:13px;font-weight:700;color:#111827;letter-spacing:0.04em;text-transform:uppercase;">
      Subscription Tax Invoice / Bill Receipt
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#f9fafb;">
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Plan</td>
        <td align="right" style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;border-bottom:1px solid #e5e7eb;">${escapeHtml(planName)} (${escapeHtml(interval)})</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Billing Cycle &amp; Validity</td>
        <td align="right" style="padding:12px 16px;font-size:13px;color:#111827;border-bottom:1px solid #e5e7eb;">${purchaseDate} to ${expiryDate}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Website Video Downloads</td>
        <td align="right" style="padding:12px 16px;font-size:13px;font-weight:600;color:#2563eb;border-bottom:1px solid #e5e7eb;">${videoQuota} Full-Resolution Videos</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Subtotal (Base Price)</td>
        <td align="right" style="padding:12px 16px;font-size:13px;color:#111827;border-bottom:1px solid #e5e7eb;">₹${subtotal.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">GST (${gstPercentage}%)</td>
        <td align="right" style="padding:12px 16px;font-size:13px;color:#111827;border-bottom:1px solid #e5e7eb;">₹${gstAmount.toLocaleString('en-IN')}</td>
      </tr>
      <tr style="background:#f3f4f6;">
        <td style="padding:14px 16px;font-size:14px;font-weight:700;color:#111827;">Total Paid</td>
        <td align="right" style="padding:14px 16px;font-size:18px;font-weight:800;color:#111827;">₹${totalAmount.toLocaleString('en-IN')}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;">Payment ID / Txn Ref</td>
        <td align="right" style="padding:10px 16px;font-size:12px;font-family:monospace;color:#6b7280;border-top:1px solid #e5e7eb;">${escapeHtml(txnId)}</td>
      </tr>
    </table>

    <div style="margin:0 0 20px;padding:14px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;line-height:1.6;color:#334155;">
      📄 <strong>Official Tax Invoice Attached:</strong> Your formal GST tax invoice and membership certificate (<code>${escapeHtml(invoiceFilename)}</code>) has been attached to this email as a PDF for your accounting and tax records.
    </div>

    <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#4b5563;">
      You can now log in to your account at any time to download editorial clips, review your quota, or manage your membership.
    </p>

    <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
      Need assistance or need to change your WhatsApp group number? Simply reply to this email or reach us at <a href="mailto:support@akhdmedia.com" style="color:#2563eb;">support@akhdmedia.com</a>.
    </p>
  `

  const html = wrapBrandEmail({
    title: `Subscription Receipt - ${planName}`,
    bodyHtml,
    currentYear,
  })

  const text = [
    `Hi ${customerName},`,
    '',
    `We have successfully received your payment for ${planName} (${interval}).`,
    '',
    'WHATSAPP GROUP ACTIVATION:',
    'In the next few hours a separate WhatsApp group will be created for you where you will keep getting all the 4K UHD videos on a daily basis.',
    `WhatsApp Number: ${whatsappNumber}`,
    '',
    'BILL & RECEIPT BREAKDOWN:',
    `Plan: ${planName} (${interval})`,
    `Validity: ${purchaseDate} to ${expiryDate}`,
    `Downloads: ${videoQuota} Videos Included`,
    `Subtotal: ₹${subtotal.toLocaleString('en-IN')}`,
    `GST (${gstPercentage}%): ₹${gstAmount.toLocaleString('en-IN')}`,
    `Total Paid: ₹${totalAmount.toLocaleString('en-IN')}`,
    `Txn ID: ${txnId}`,
    '',
    'ATTACHED DOCUMENT:',
    invoiceFilename,
    '',
    `${BRAND_NAME} Team`,
  ].join('\n')

  const attachments = invoiceBuffer
    ? [
        {
          filename: invoiceFilename,
          content: invoiceBuffer.toString('base64'),
        },
      ]
    : []

  try {
    const result = await resend.emails.send({
      from: getResendFrom(),
      to: [customerEmail],
      subject: `🎉 Payment Received & Subscription Activated - ${planName} | ${BRAND_NAME}`,
      html,
      text,
      ...(attachments.length ? { attachments } : {}),
    })
    console.log('[email] Subscription confirmation email sent (with invoice attachment):', result?.data?.id || result?.id)
    return { sent: true, id: result?.data?.id || result?.id }
  } catch (err) {
    console.error('[email] Failed to send subscription confirmation email:', err.message)
    return { sent: false, error: err.message }
  }
}


export const sendSubscriptionVideoDownloadEmail = async ({
  user,
  product,
  files = [],
  imageSize = '',
  licenseNumber = '',
  orderNumber = '',
  linkExpiry,
  quotaRemaining,
  totalQuota,
  planName = 'Active Plan',
  isRedownload = false,
}) => {
  const customerEmail = user?.email?.trim()
  if (!customerEmail) {
    console.warn('[email] Skipped subscription video claim email — no customer email')
    return { sent: false, reason: 'missing_email' }
  }

  const resend = getResendClient()
  if (!resend || !isEmailConfigured()) {
    console.warn('[email] Resend not configured — subscription video claim email not sent')
    return { sent: false, reason: 'resend_not_configured' }
  }

  const customerName = user.name || customerEmail.split('@')[0] || 'Subscriber'
  const currentYear = new Date().getFullYear()
  const claimDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const videoFiles = files.filter((f) => f.type === 'video')
  const primaryVideo = videoFiles[0] || files[0]

  if (!primaryVideo?.url) {
    console.warn(`[email] Skipped subscription video claim email for "${product.name}" — no download URL available`)
    return { sent: false, reason: 'no_download_url' }
  }

  const subject = isRedownload
    ? `🎬 Fresh Master Video Download Link (${product.name}) | ${BRAND_NAME}`
    : `🎬 Your Master Video Download Link (${product.name}) - Subscription Quota | ${BRAND_NAME}`

  const bodyHtml = `
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;line-height:1.3;color:#111827;">
      ${isRedownload ? 'Fresh Master Video Download Link' : 'Your Master Video is Ready for Download!'}
    </h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#374151;">
      Hi ${escapeHtml(customerName)},
    </p>

    <!-- Subscription Quota Notice Card -->
    <div style="margin:0 0 24px;padding:18px 20px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
      <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1e40af;">
        ⚡ Claimed via Active Subscription Quota
      </p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:#1e3a8a;">
        ${
          isRedownload
            ? `You previously unlocked this video under your <strong>${escapeHtml(planName)}</strong> membership. No extra credits were deducted.`
            : `You have successfully claimed this master video using <strong>1 download credit</strong> from your <strong>${escapeHtml(planName)}</strong> membership.`
        }
      </p>
      <div style="margin:12px 0 0;padding-top:10px;border-top:1px dashed #93c5fd;font-size:13px;color:#1e40af;">
        <strong>Subscription Quota Remaining:</strong>
        <span style="display:inline-block;margin-left:6px;padding:2px 10px;background:#2563eb;color:#ffffff;border-radius:12px;font-weight:700;font-size:12px;">
          ${quotaRemaining} of ${totalQuota} Videos Left
        </span>
      </div>
    </div>

    <!-- Video Details Table -->
    <p style="margin:24px 0 10px;font-size:13px;font-weight:700;color:#111827;letter-spacing:0.04em;text-transform:uppercase;">
      Video Specifications
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#f9fafb;">
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;width:40%;">Video Title</td>
        <td align="right" style="padding:12px 16px;font-size:14px;font-weight:700;color:#111827;border-bottom:1px solid #e5e7eb;">${escapeHtml(product.name)}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Clip ID</td>
        <td align="right" style="padding:12px 16px;font-size:13px;font-family:monospace;color:#111827;border-bottom:1px solid #e5e7eb;">${escapeHtml(product.clipId || '—')}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">License Number</td>
        <td align="right" style="padding:12px 16px;font-size:13px;font-family:monospace;color:#111827;border-bottom:1px solid #e5e7eb;">${escapeHtml(licenseNumber || '—')}</td>
      </tr>
      ${orderNumber ? `<tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Order Reference</td>
        <td align="right" style="padding:12px 16px;font-size:13px;font-family:monospace;color:#111827;border-bottom:1px solid #e5e7eb;">#${escapeHtml(orderNumber.slice(-8).toUpperCase())}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Resolution / Quality</td>
        <td align="right" style="padding:12px 16px;font-size:13px;font-weight:600;color:#2563eb;border-bottom:1px solid #e5e7eb;">4K-UHD RAW Master ${imageSize ? `(${escapeHtml(imageSize)})` : ''}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;font-size:13px;color:#6b7280;">Date Claimed</td>
        <td align="right" style="padding:12px 16px;font-size:13px;color:#111827;">${claimDate}</td>
      </tr>
    </table>

    <!-- Download Section -->
    <p style="margin:24px 0 10px;font-size:13px;font-weight:700;color:#111827;letter-spacing:0.04em;text-transform:uppercase;">
      Download Master File
    </p>
    ${files.map((file) => `
      <div style="margin:0 0 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
          <tr>
            <td align="center" style="border-radius:8px;background:#2563eb;">
              <a
                href="${escapeHtml(file.url)}"
                style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:8px;background:#2563eb;"
              >
                ${file.type === 'video' ? '⬇ Download 4K Master Video' : `⬇ Download ${escapeHtml(file.label || 'File')}`}
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0;font-size:12px;color:#6b7280;word-break:break-all;">
          File: ${escapeHtml(file.label || product.name)}
        </p>
      </div>
    `).join('')}

    <!-- Link Expiry Notice -->
    <div style="margin:20px 0 24px;padding:14px 18px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;">
      <p style="margin:0;font-size:13px;line-height:1.6;color:#92400e;">
        ⏰ <strong>Security Notice / Link Validity:</strong> This master video download link is time-limited and valid until <strong>${escapeHtml(linkExpiry)} (IST)</strong> (3 days / 72 hours). Please download and save your master video locally before this time.
      </p>
    </div>

    <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#4b5563;">
      Need to re-download after expiration? Simply return to this video's page on <strong>${BRAND_NAME}</strong> while your subscription remains active to download again using 1 credit from your quota.
    </p>

    <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#111827;">
      Warm regards,<br>
      <strong>${BRAND_NAME} Team</strong>
    </p>
  `

  const html = wrapBrandEmail({
    title: `Master Video Download - ${product.name}`,
    bodyHtml,
    currentYear,
  })

  const textLines = [
    `Hi ${customerName},`,
    '',
    isRedownload
      ? `Here is your fresh master video download link for "${product.name}".`
      : `Your master video "${product.name}" is ready for download!`,
    '',
    'SUBSCRIPTION QUOTA:',
    isRedownload
      ? `Unlocked under your active plan: ${planName} (Zero credit re-download)`
      : `Claimed with 1 credit from your plan: ${planName}`,
    `Remaining Quota: ${quotaRemaining} of ${totalQuota} videos left`,
    '',
    'VIDEO DETAILS:',
    `Title: ${product.name}`,
    `Clip ID: ${product.clipId || '—'}`,
    `Format: 4K-UHD RAW Master ${imageSize ? `(${imageSize})` : ''}`,
    `Date Claimed: ${claimDate}`,
    '',
    'DOWNLOAD LINKS:',
    ...files.map((f) => `${f.type === 'video' ? 'Master Video' : f.label}: ${f.url}`),
    '',
    `IMPORTANT: This download link expires on ${linkExpiry} (IST) (3 days / 72 hours).`,
    '',
    `Warm regards,`,
    `${BRAND_NAME} Team`,
  ]

  try {
    const result = await resend.emails.send({
      from: getResendFrom(),
      to: [customerEmail],
      subject,
      html,
      text: textLines.join('\n'),
    })
    console.log('[email] Subscription video download email sent successfully:', result?.data?.id || result?.id)
    return { sent: true, id: result?.data?.id || result?.id }
  } catch (err) {
    console.error('[email] Failed to send subscription video download email:', err.message)
    return { sent: false, error: err.message }
  }
}
