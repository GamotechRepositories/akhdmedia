import { BRAND } from '../config/brand'

const SUBJECT_LABELS = {
  download: 'Download issue',
  license_email: 'License email',
  payment: 'Payment',
  license: 'License',
  other: 'General inquiry',
}

export const REPLY_PLACEHOLDER = 'Type your reply here...'

export const buildSupportReplyEmailParts = (request) => {
  const issueType = SUBJECT_LABELS[request.subject] || SUBJECT_LABELS.other

  return {
    prefix: `Support Team Response
Ticket ${request.ticketNumber}

Hi ${request.name},

Thank you for contacting ${BRAND.name} support regarding ${issueType}. We have reviewed your request and our team has shared the following update:`,
    reply: '',
    suffix: `

YOUR ORIGINAL MESSAGE

${request.message}

If you need further assistance, reply to this email.

Warm regards,
${BRAND.name} Support Team`,
  }
}

export const combineSupportReplyEmailParts = ({ prefix, reply, suffix }) => {
  const trimmedReply = reply.trim()
  const replyBlock = trimmedReply || REPLY_PLACEHOLDER
  return `${prefix.trimEnd()}\n\n${replyBlock}${suffix}`
}

export const buildSupportReplyEmailDraft = (request, replyMessage = '') =>
  combineSupportReplyEmailParts({
    ...buildSupportReplyEmailParts(request),
    reply: replyMessage,
  })

const REPLY_INTRO_MARKER = ' and our team has shared the following update:'
const ORIGINAL_MESSAGE_MARKER = '\n\nYOUR ORIGINAL MESSAGE\n\n'

export const parseSupportReplyEmailParts = (fullText, request) => {
  const defaults = buildSupportReplyEmailParts(request)
  const text = String(fullText || '')

  const originalIndex = text.indexOf(ORIGINAL_MESSAGE_MARKER)
  if (originalIndex === -1) {
    return defaults
  }

  const beforeOriginal = text.slice(0, originalIndex)
  const suffix = text.slice(originalIndex)

  const introIndex = beforeOriginal.lastIndexOf(REPLY_INTRO_MARKER)
  if (introIndex === -1) {
    return { ...defaults, suffix }
  }

  const prefix = beforeOriginal.slice(0, introIndex + REPLY_INTRO_MARKER.length)
  const replyRaw = beforeOriginal.slice(introIndex + REPLY_INTRO_MARKER.length).trim()

  return {
    prefix,
    reply: replyRaw === REPLY_PLACEHOLDER ? '' : replyRaw,
    suffix,
  }
}

export const isFullSupportReplyEmail = (message = '') => {
  const trimmed = message.trim()
  if (!trimmed) return false
  return (
    trimmed.includes('Support Team Response') ||
    trimmed.includes('Warm regards') ||
    trimmed.includes('YOUR ORIGINAL MESSAGE')
  )
}
