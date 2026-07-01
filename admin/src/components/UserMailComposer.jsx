import { useMemo } from 'react'
import { BRAND } from '../config/brand'
import { secondaryBtnClass } from './ui/adminUi'
import {
  MESSAGE_PLACEHOLDER,
  combineUserBroadcastEmailParts,
  parseUserBroadcastEmailParts,
} from '../utils/userBroadcastEmailDraft'

const sectionClass =
  'block w-full resize-none border-0 bg-white font-sans text-[15px] leading-relaxed text-slate-900 outline-none focus:ring-0'

const fieldInputClass =
  'min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0'

const formatFileSize = (bytes = 0) => {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const isImageAttachment = (contentType = '') => contentType.startsWith('image/')

const UserMailComposer = ({
  emailFrom,
  onEmailFromChange,
  toLabel,
  emailSubject,
  onEmailSubjectChange,
  emailDraft,
  onEmailDraftChange,
  attachments = [],
  maxAttachments = 5,
  onAttachmentSelect,
  onRemoveAttachment,
  mailing = false,
}) => {
  const parts = useMemo(() => parseUserBroadcastEmailParts(emailDraft), [emailDraft])

  const updatePart = (key, nextValue) => {
    onEmailDraftChange(
      combineUserBroadcastEmailParts({
        ...parts,
        [key]: nextValue,
      }),
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-14 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
              From
            </span>
            <input
              type="text"
              value={emailFrom}
              onChange={(event) => onEmailFromChange(event.target.value)}
              placeholder="AKHD MEDIA & CO <noreply@akhdmedia.com>"
              className={fieldInputClass}
              aria-label="From email address"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-14 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
              To
            </span>
            <span className="min-w-0 flex-1 text-sm text-slate-700">{toLabel}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-14 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
              Subject
            </span>
            <input
              type="text"
              value={emailSubject}
              onChange={(event) => onEmailSubjectChange(event.target.value)}
              placeholder="Enter email subject"
              className={fieldInputClass}
              aria-label="Email subject"
            />
          </div>
        </div>
        <p className="mt-3 text-xs font-medium text-slate-600">
          Editable — this is the full email your selected users will receive
        </p>
      </div>

      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-[17px] font-bold tracking-wide text-slate-900">{BRAND.name}</p>
      </div>

      <div className="px-5 py-6">
        <textarea
          value={parts.prefix}
          onChange={(event) => updatePart('prefix', event.target.value)}
          rows={5}
          spellCheck
          className={`${sectionClass} px-0 py-0`}
          aria-label="Email introduction"
        />

        <textarea
          value={parts.body}
          onChange={(event) => updatePart('body', event.target.value)}
          rows={4}
          spellCheck
          placeholder={MESSAGE_PLACEHOLDER}
          className={`${sectionClass} mt-4 px-0 py-0 text-slate-900 placeholder:text-blue-400/70 placeholder:opacity-100`}
          aria-label="Your message to users"
        />

        <textarea
          value={parts.suffix}
          onChange={(event) => updatePart('suffix', event.target.value)}
          rows={6}
          spellCheck
          className={`${sectionClass} mt-4 px-0 py-0`}
          aria-label="Email closing"
        />
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Attachments
          </span>
          <span className="text-xs text-slate-500">
            {attachments.length}/{maxAttachments}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className={`${secondaryBtnClass} cursor-pointer`}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              multiple
              className="hidden"
              disabled={mailing || attachments.length >= maxAttachments}
              onChange={onAttachmentSelect}
            />
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
              Attach file
            </span>
          </label>
          <span className="text-xs text-slate-500">JPEG, PNG, WebP, GIF, PDF — max 10MB each</span>
        </div>

        {attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {attachments.map((item) => (
              <div
                key={item.id}
                className="inline-flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2 text-xs text-slate-700"
              >
                {isImageAttachment(item.contentType) ? (
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-[10px] font-bold text-red-700">
                    PDF
                  </span>
                )}
                <span className="max-w-[10rem] truncate font-medium">{item.filename}</span>
                <span className="text-slate-400">{formatFileSize(item.size)}</span>
                <a
                  href={item.previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-600 underline"
                >
                  View
                </a>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(item.id)}
                  disabled={mailing}
                  className="font-semibold text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserMailComposer
