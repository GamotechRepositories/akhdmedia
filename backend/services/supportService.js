import SupportRequest from '../models/SupportRequest.js'
import AppError from '../utils/AppError.js'

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
