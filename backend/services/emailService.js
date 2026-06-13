import nodemailer from 'nodemailer'
import { BRAND_NAME, getFrontendUrl, isEmailConfigured } from '../config/email.js'

let transporter = null

const getTransporter = () => {
  if (transporter) return transporter

  if (!isEmailConfigured()) {
    return null
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  return transporter
}

const buildLicenseEmailHtml = ({ order, downloads, customerName }) => {
  const orderRef = order.orderNumber?.slice(-8).toUpperCase() || '—'
  const successUrl = `${getFrontendUrl()}/order-success?method=online&orderId=${order._id}`

  const itemBlocks = downloads
    .map((item) => {
      const fileLinks = item.files
        .map(
          (file) =>
            `<li><a href="${file.url}" style="color:#111827;">${file.label}</a> (${file.type})</li>`,
        )
        .join('')

      return `
        <div style="margin-bottom:16px;padding:14px;border:1px solid #e5e7eb;border-radius:12px;">
          <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111827;">${item.name}</p>
          <p style="margin:0 0 4px;font-size:13px;color:#4b5563;">Clip ID: <strong>${item.clipId || '—'}</strong></p>
          <p style="margin:0 0 4px;font-size:13px;color:#4b5563;">License: <strong>${item.imageSize || 'Standard'}</strong></p>
          <p style="margin:0 0 8px;font-size:13px;color:#4b5563;">License No: <strong>${item.licenseNumber || '—'}</strong></p>
          ${
            fileLinks
              ? `<ul style="margin:0;padding-left:18px;font-size:13px;color:#374151;">${fileLinks}</ul>`
              : `<p style="margin:0;font-size:13px;color:#b45309;">Download files are being prepared. Open your order page shortly.</p>`
          }
        </div>
      `
    })
    .join('')

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827;">
      <h1 style="font-size:22px;margin-bottom:8px;">Your ${BRAND_NAME} license is ready</h1>
      <p style="font-size:14px;color:#4b5563;line-height:1.6;">
        Hi ${customerName || 'there'},<br/>
        Thank you for your purchase. Your commercial license and download links are below.
      </p>
      <p style="font-size:13px;color:#6b7280;">Order #${orderRef}</p>
      ${itemBlocks}
      <p style="margin-top:18px;font-size:13px;color:#4b5563;">
        You can also view this order anytime:
        <a href="${successUrl}" style="color:#111827;">${successUrl}</a>
      </p>
      <p style="margin-top:20px;font-size:12px;color:#9ca3af;">
        Links expire after a limited time. Save your files and license numbers for your records.
      </p>
    </div>
  `
}

export const sendOrderLicenseEmail = async ({ order, downloads }) => {
  const transport = getTransporter()
  const customerEmail = order.billingAddress?.email?.trim()

  if (!customerEmail) {
    console.warn('[email] Skipped license email — no customer email on order')
    return { sent: false, reason: 'missing_email' }
  }

  if (!transport) {
    console.warn('[email] SMTP not configured — license email not sent')
    return { sent: false, reason: 'smtp_not_configured' }
  }

  const html = buildLicenseEmailHtml({
    order,
    downloads,
    customerName: order.billingAddress?.name,
  })

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: customerEmail,
    subject: `${BRAND_NAME} — Your license & download links (Order #${order.orderNumber?.slice(-8).toUpperCase()})`,
    html,
  })

  return { sent: true }
}
