import AppError from './AppError.js'

const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
])

export const MAX_EMAIL_ATTACHMENTS = 5
export const MAX_EMAIL_ATTACHMENT_BYTES = 10 * 1024 * 1024

export const prepareEmailAttachmentsForSend = async (rawAttachments = []) => {
  if (!Array.isArray(rawAttachments) || rawAttachments.length === 0) {
    return { stored: [], resend: [] }
  }

  if (rawAttachments.length > MAX_EMAIL_ATTACHMENTS) {
    throw new AppError(`Maximum ${MAX_EMAIL_ATTACHMENTS} attachments allowed`, 400)
  }

  const stored = []
  const resend = []

  for (const item of rawAttachments) {
    const filename = String(item?.filename || '').trim()
    const contentType = String(item?.contentType || '').trim().toLowerCase()
    const content = String(item?.content || '').trim()
    const declaredSize = Number(item?.size) || 0

    if (!filename || !content) {
      throw new AppError('Each attachment must include filename and file data', 400)
    }

    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      throw new AppError(`File type not allowed: ${filename}`, 400)
    }

    if (declaredSize > MAX_EMAIL_ATTACHMENT_BYTES) {
      throw new AppError(`File too large (max 10MB): ${filename}`, 400)
    }

    let buffer
    try {
      buffer = Buffer.from(content, 'base64')
    } catch {
      throw new AppError(`Invalid attachment data: ${filename}`, 400)
    }

    if (!buffer.length) {
      throw new AppError(`Invalid attachment: ${filename}`, 400)
    }

    if (buffer.length > MAX_EMAIL_ATTACHMENT_BYTES) {
      throw new AppError(`File too large (max 10MB): ${filename}`, 400)
    }

    const base64 = buffer.toString('base64')

    stored.push({
      filename,
      contentType,
      size: buffer.length,
    })

    resend.push({
      filename,
      content: base64,
    })
  }

  return { stored, resend }
}
