import { useMemo } from 'react'
import { BRAND } from '../config/brand'
import {
  REPLY_PLACEHOLDER,
  combineSupportReplyEmailParts,
  parseSupportReplyEmailParts,
} from '../utils/supportReplyEmailDraft'

const sectionClass =
  'block w-full resize-none border-0 bg-white font-sans text-[15px] leading-relaxed text-slate-900 outline-none focus:ring-0'

const SupportReplyEmailEditor = ({ value, onChange, recipientEmail, request }) => {
  const parts = useMemo(
    () => parseSupportReplyEmailParts(value, request),
    [value, request],
  )

  const updatePart = (key, nextValue) => {
    onChange(
      combineSupportReplyEmailParts({
        ...parts,
        [key]: nextValue,
      }),
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            To: <strong className="text-slate-700">{recipientEmail}</strong>
          </span>
          <span className="font-medium text-slate-600">
            Editable — this is the full email the customer will receive
          </span>
        </div>
      </div>

      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-[17px] font-bold tracking-wide text-slate-900">{BRAND.name}</p>
      </div>

      <div className="px-5 py-6">
        <textarea
          value={parts.prefix}
          onChange={(event) => updatePart('prefix', event.target.value)}
          rows={8}
          spellCheck
          className={`${sectionClass} px-0 py-0`}
          aria-label="Email introduction"
        />

        <textarea
          value={parts.reply}
          onChange={(event) => updatePart('reply', event.target.value)}
          rows={3}
          spellCheck
          placeholder={REPLY_PLACEHOLDER}
          className={`${sectionClass} mt-4 px-0 py-0 text-slate-900 placeholder:text-blue-400/70 placeholder:opacity-100`}
          aria-label="Your reply to the customer"
        />

        <textarea
          value={parts.suffix}
          onChange={(event) => updatePart('suffix', event.target.value)}
          rows={10}
          spellCheck
          className={`${sectionClass} mt-4 px-0 py-0`}
          aria-label="Email closing and original message"
        />
      </div>
    </div>
  )
}

export default SupportReplyEmailEditor
