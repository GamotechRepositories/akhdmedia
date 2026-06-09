import nodemailer from 'nodemailer'
import {
  isEmailEnabled,
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASS,
  SMTP_PORT,
  SMTP_USER,
} from '../config/email.js'

let transporter = null

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })
  }
  return transporter
}

export const sendEmail = async ({ to, subject, html, text }) => {
  if (!isEmailEnabled()) {
    console.log('[Email skipped — SMTP not configured]', { to, subject })
    return { sent: false, skipped: true }
  }

  const info = await getTransporter().sendMail({
    from: SMTP_FROM,
    to,
    subject,
    html,
    text,
  })

  return { sent: true, messageId: info.messageId }
}
