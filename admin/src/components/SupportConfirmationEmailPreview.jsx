import { BRAND } from '../config/brand'

const SUBJECT_LABELS = {
  download: 'Download issue',
  license_email: 'License email',
  payment: 'Payment',
  license: 'License',
  other: 'General inquiry',
}

const SupportConfirmationEmailPreview = ({ request }) => {
  const issueType = SUBJECT_LABELS[request.subject] || SUBJECT_LABELS.other

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-[17px] font-bold tracking-wide text-slate-900">{BRAND.name}</p>
      </div>

      <div className="space-y-4 px-5 py-6 text-[15px] leading-relaxed text-slate-900">
        <div>
          <h3 className="text-[22px] font-bold leading-snug text-slate-900">We Have Received Your Request</h3>
          <p className="mt-2 text-sm text-slate-600">
            Ticket <strong className="text-slate-900">{request.ticketNumber}</strong>
          </p>
        </div>

        <p>Hi {request.name},</p>

        <p>
          Thank you for reaching out to {BRAND.name}. Your support request has been received
          successfully. Our team will review your issue and work to resolve it as quickly as
          possible.
        </p>

        <p>
          <strong>What happens next?</strong>
          <br />
          A member of our support team will review your request and respond to you by email with an
          update or solution.
        </p>

        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-slate-900">
            Request summary
          </p>
          <p className="mt-2">
            <strong>Issue type:</strong> {issueType}
          </p>
          {request.orderNumber ? (
            <p className="mt-2">
              <strong>Order number:</strong> {request.orderNumber}
            </p>
          ) : null}
          <p className="mt-2">
            <strong>Your message:</strong>
            <br />
            <span className="whitespace-pre-wrap">{request.message}</span>
          </p>
        </div>

        <p>
          Please keep this email for your records. You can reply to this email if you have
          additional details to share.
        </p>

        <p>
          Warm regards,
          <br />
          <strong>{BRAND.name} Support Team</strong>
        </p>
      </div>
    </div>
  )
}

export default SupportConfirmationEmailPreview
