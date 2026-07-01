import { BRAND } from '../config/brand'

export const MESSAGE_PLACEHOLDER = 'Type your message here...'

export const buildUserBroadcastEmailParts = () => ({
  prefix: `Hi,

We have an update from ${BRAND.name} for you.`,
  body: '',
  suffix: `

If you have any questions, reply to this email.

Warm regards,
${BRAND.name} Team`,
})

export const combineUserBroadcastEmailParts = ({ prefix, body, suffix }) => {
  const trimmedBody = body.trim()
  const bodyBlock = trimmedBody || MESSAGE_PLACEHOLDER
  return `${prefix.trimEnd()}\n\n${bodyBlock}${suffix}`
}

export const buildUserBroadcastEmailDraft = (message = '') =>
  combineUserBroadcastEmailParts({
    ...buildUserBroadcastEmailParts(),
    body: message,
  })

const BODY_INTRO_MARKER = ' for you.'

export const parseUserBroadcastEmailParts = (fullText = '') => {
  const defaults = buildUserBroadcastEmailParts()
  const text = String(fullText || '')

  const warmRegardsIndex = text.indexOf('\n\nIf you have any questions')
  if (warmRegardsIndex === -1) {
    return defaults
  }

  const prefixAndBody = text.slice(0, warmRegardsIndex)
  const suffix = text.slice(warmRegardsIndex)

  const introIndex = prefixAndBody.lastIndexOf(BODY_INTRO_MARKER)
  if (introIndex === -1) {
    return { ...defaults, suffix }
  }

  const prefix = prefixAndBody.slice(0, introIndex + BODY_INTRO_MARKER.length)
  const bodyRaw = prefixAndBody.slice(introIndex + BODY_INTRO_MARKER.length).trim()

  return {
    prefix,
    body: bodyRaw === MESSAGE_PLACEHOLDER ? '' : bodyRaw,
    suffix,
  }
}
