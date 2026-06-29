import SupportRequest from '../models/SupportRequest.js'
import AppError from '../utils/AppError.js'
import { sendSupportReplyEmail, sendSupportRequestConfirmationEmail } from './emailService.js'

const VALID_SUBJECTS = new Set(['download', 'license_email', 'payment', 'license', 'other'])
const VALID_STATUSES = new Set(['open', 'in_progress', 'resolved', 'closed'])

const isValidEmail = (value = '') => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

const buildTicketNumber = () => {
  const suffix = Math.floor(1000 + Math.random() * 9000)
  return `SUP-${Date.now().toString().slice(-8)}${suffix}`
}

export const createSupportRequest = async (payload, sessionId = '') => {
  const name = payload.name?.trim()
  const email = payload.email?.trim().toLowerCase()
  const message = payload.message?.trim()
  const subject = VALID_SUBJECTS.has(payload.subject) ? payload.subject : 'other'

  if (!name) throw new AppError('Please enter your name', 400)
  if (!email || !isValidEmail(email)) throw new AppError('Please enter a valid email address', 400)
  if (!message || message.length < 10) {
    throw new AppError('Please describe your issue in at least 10 characters', 400)
  }

  const request = await SupportRequest.create({
    ticketNumber: buildTicketNumber(),
    sessionId: sessionId || '',
    name,
    email,
    phone: payload.phone?.trim() || '',
    orderNumber: payload.orderNumber?.trim() || '',
    subject,
    message,
    status: 'open',
  })

  try {
    const emailResult = await sendSupportRequestConfirmationEmail(request)
    if (emailResult.sent) {
      request.replies.push({
        kind: 'confirmation',
        message: '',
        sentAt: new Date(),
      })
      await request.save()
    } else {
      console.warn(
        `[email] Support confirmation not sent to ${email}:`,
        emailResult.reason,
        emailResult.error || '',
      )
    }
  } catch (err) {
    console.error('[email] Support confirmation email failed:', err.message)
  }

  return request
}

export const getAllSupportRequests = async () =>
  SupportRequest.find().sort({ createdAt: -1 })

export const getSupportRequestById = async (id) => {
  const request = await SupportRequest.findById(id)
  if (!request) throw new AppError('Support request not found', 404)
  return request
}

export const updateSupportRequestStatus = async (id, { status, adminNotes }) => {
  const request = await getSupportRequestById(id)

  if (status) {
    if (!VALID_STATUSES.has(status)) {
      throw new AppError('Invalid support request status', 400)
    }
    request.status = status
  }

  if (adminNotes !== undefined) {
    request.adminNotes = adminNotes.trim()
  }

  await request.save()
  return request
}

export const replyToSupportRequest = async (id, { replyMessage, emailBody, status }) => {
  const customBody = emailBody?.trim()
  const message = customBody || replyMessage?.trim()

  if (!message || message.length < 5) {
    throw new AppError('Reply must be at least 5 characters', 400)
  }

  if (customBody && customBody.includes('Type your reply here')) {
    throw new AppError('Please replace the placeholder text with your reply before sending', 400)
  }

  const request = await getSupportRequestById(id)

  const emailResult = await sendSupportReplyEmail({
    request,
    replyMessage: customBody ? '' : message,
    emailBody: customBody,
  })

  if (!emailResult.sent) {
    throw new AppError(
      emailResult.reason === 'resend_not_configured'
        ? 'Email service is not configured. Please set up Resend on the server.'
        : 'Could not send reply email to the customer',
      503,
    )
  }

  request.replies.push({
    kind: 'admin_reply',
    message,
    sentAt: new Date(),
  })
  request.lastReplyAt = new Date()

  if (status) {
    if (!VALID_STATUSES.has(status)) {
      throw new AppError('Invalid support request status', 400)
    }
    request.status = status
  } else if (request.status === 'open') {
    request.status = 'in_progress'
  }

  await request.save()
  return request
}
