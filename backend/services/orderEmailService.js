import { getFrontendUrl, getApiPublicUrl } from '../config/email.js'
import { sendEmail } from './emailService.js'
import { getOrderItemDownloads } from './downloadService.js'

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const toAbsoluteUrl = (url = '') => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${getApiPublicUrl()}${url.startsWith('/') ? url : `/${url}`}`
}

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const buildDownloadSections = (downloads = []) =>
  downloads
    .map((item) => {
      const fileRows =
        item.files?.length > 0
          ? item.files
              .map(
                (file) => `
          <tr>
            <td style="padding:8px 0;color:#374151;font-size:14px;">
              ${escapeHtml(file.label || 'Download file')}
            </td>
            <td style="padding:8px 0;text-align:right;">
              <a href="${escapeHtml(toAbsoluteUrl(file.url))}"
                 style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:8px 14px;border-radius:999px;font-size:12px;font-weight:600;">
                Download
              </a>
            </td>
          </tr>`,
              )
              .join('')
          : `<tr><td colspan="2" style="padding:8px 0;color:#b45309;font-size:13px;">
              ${escapeHtml(item.message || 'Files are being prepared. Open your order page shortly.')}
            </td></tr>`

      return `
        <div style="margin-bottom:20px;padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;">
          <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;">${escapeHtml(item.name)}</p>
          <p style="margin:0 0 12px;font-size:12px;color:#6b7280;">License: ${escapeHtml(item.imageSize || 'Standard')}</p>
          <table width="100%" cellpadding="0" cellspacing="0">${fileRows}</table>
        </div>`
    })
    .join('')

export const sendOrderConfirmationEmail = async (order) => {
  const email = order.billingAddress?.email?.trim()
  if (!email) {
    console.warn(`Order ${order.orderNumber} has no billing email — skipping confirmation email`)
    return { sent: false, skipped: true }
  }

  const downloads = await getOrderItemDownloads(order)
  const orderPageUrl = `${getFrontendUrl()}/order-success?orderId=${order._id}&method=${order.paymentMethod || 'online'}`
  const customerName = order.billingAddress?.name || 'there'
  const total = formatCurrency(order.totalAmount || 0)

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f9fafb;padding:24px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:24px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;">FrameVault</p>
        <h1 style="margin:0 0 12px;font-size:24px;color:#111827;">Your download is ready</h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4b5563;">
          Hi ${escapeHtml(customerName)}, thank you for your purchase. Your license order
          <strong>#${escapeHtml(order.orderNumber)}</strong> is confirmed.
        </p>

        ${buildDownloadSections(downloads)}

        <div style="margin:24px 0;padding:16px;background:#f3f4f6;border-radius:12px;">
          <p style="margin:0 0 8px;font-size:13px;color:#374151;"><strong>Order total:</strong> ${escapeHtml(total)}</p>
          <p style="margin:0;font-size:13px;color:#374151;">
            You can also access your downloads anytime from your order page.
          </p>
        </div>

        <a href="${escapeHtml(orderPageUrl)}"
           style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:600;">
          View Order & Downloads
        </a>

        <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#9ca3af;">
          Need help? Reply to this email or contact licensing@framevault.com
        </p>
      </div>
    </div>`

  const textLines = [
    `Hi ${customerName},`,
    '',
    `Your FrameVault order #${order.orderNumber} is confirmed.`,
    `Total: ${total}`,
    '',
    'Downloads:',
  ]

  downloads.forEach((item) => {
    textLines.push(`- ${item.name} (${item.imageSize || 'Standard'})`)
    if (item.files?.length) {
      item.files.forEach((file) => {
        textLines.push(`  ${file.label}: ${toAbsoluteUrl(file.url)}`)
      })
    } else {
      textLines.push(`  ${item.message || 'Files preparing — open order page'}`)
    }
  })

  textLines.push('', `Order page: ${orderPageUrl}`)

  return sendEmail({
    to: email,
    subject: `Your FrameVault download — Order #${order.orderNumber}`,
    html,
    text: textLines.join('\n'),
  })
}

export const queueOrderConfirmationEmail = (order) => {
  if (!order) return

  setImmediate(() => {
    sendOrderConfirmationEmail(order).catch((error) => {
      console.error(`Failed to send order email for ${order.orderNumber}:`, error)
    })
  })
}
