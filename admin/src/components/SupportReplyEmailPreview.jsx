import { BRAND } from '../config/brand'

const SUBJECT_LABELS = {
  download: 'Download issue',
  license_email: 'License email',
  payment: 'Payment',
  license: 'License',
  other: 'General inquiry',
}

const SupportReplyEmailPreview = ({ request, replyMessage, fullEmail = false }) => {
  if (fullEmail) {
    return (
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4">
          <p className="text-[17px] font-bold tracking-wide text-slate-900">{BRAND.name}</p>
        </div>
        <div className="whitespace-pre-wrap px-5 py-6 text-[15px] leading-relaxed text-slate-900">
          {replyMessage}
        </div>
      </div>
    )
  }

  const issueType = SUBJECT_LABELS[request.subject] || SUBJECT_LABELS.other

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-[17px] font-bold tracking-wide text-slate-900">{BRAND.name}</p>
      </div>

      <div className="space-y-4 px-5 py-6 text-[15px] leading-relaxed text-slate-900">
        <div>
          <h3 className="text-[22px] font-bold leading-snug text-slate-900">Support Team Response</h3>
          <p className="mt-2 text-sm text-slate-600">
            Ticket <strong className="text-slate-900">{request.ticketNumber}</strong>
          </p>
        </div>

        <p>Hi {request.name},</p>

        <p>
          Thank you for contacting {BRAND.name} support regarding{' '}
          <strong>{issueType}</strong>. We have reviewed your request and our team has shared the
          following update:
        </p>

        <p className="whitespace-pre-wrap">{replyMessage}</p>

        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-900">
            Your original message
          </p>
          <p className="mt-2 whitespace-pre-wrap">{request.message}</p>
        </div>

        <p>If you need further assistance, reply to this email.</p>

        <p>
          Warm regards,
          <br />
          <strong>{BRAND.name} Support Team</strong>
        </p>
      </div>
    </div>
  )
}

export default SupportReplyEmailPreview
