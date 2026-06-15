import { Resend } from 'resend'
import { getResendApiKey, getResendFrom, isEmailConfigured } from '../config/email.js'

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
      Akhd Media
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
      © {{current_year}} Akhd Media. All rights reserved.
    </p>

  </div>

</body>
</html>`

const buildDownloadSection = (downloadUrl) =>
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
    </div>`

const fillLicenseEmailTemplate = ({
  customerName,
  videoTitle,
  clipId,
  licenseNumber,
  purchaseDate,
  downloadUrl,
  currentYear,
}) =>
  LICENSE_EMAIL_TEMPLATE.replace(/{{customer_name}}/g, escapeHtml(customerName))
    .replace(/{{video_title}}/g, escapeHtml(videoTitle))
    .replace(/{{clip_id}}/g, escapeHtml(clipId))
    .replace(/{{license_number}}/g, escapeHtml(licenseNumber))
    .replace(/{{purchase_date}}/g, escapeHtml(purchaseDate))
    .replace(/{{download_section}}/g, buildDownloadSection(downloadUrl))
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

    const html = fillLicenseEmailTemplate({
      customerName,
      videoTitle: item.name,
      clipId: item.clipId || '—',
      licenseNumber: item.licenseNumber || '—',
      purchaseDate,
      downloadUrl: downloadFile.url,
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
