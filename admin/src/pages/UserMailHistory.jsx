import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import AdminAlertModal from '../components/AdminAlertModal'
import { cardClass, secondaryBtnClass } from '../components/ui/adminUi'
import { fetchUserEmailHistory } from '../api/client'

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const isImageAttachment = (contentType = '') => contentType.startsWith('image/')

const formatFileSize = (bytes = 0) => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const UserMailHistory = () => {
  const { id } = useParams()
  const location = useLocation()
  const fromList = location.state?.fromList
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  const [historyItems, setHistoryItems] = useState([])

  useEffect(() => {
    let active = true

    const loadHistory = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchUserEmailHistory(id)
        if (!active) return
        const payload = response.data?.data || {}
        setUser(payload.user || null)
        setHistoryItems(payload.history || [])
      } catch (historyError) {
        if (!active) return
        setError(historyError.message || 'Could not load email history')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadHistory()
    return () => {
      active = false
    }
  }, [id])

  return (
    <section className="space-y-4">
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              User mail history
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {user ? `${user.name || 'User'} (${user.email || '—'})` : 'Loading user...'}
            </p>
          </div>
          <Link
            to="/user-mail"
            state={{
              restore: {
                userId: fromList?.userId || id,
                page: fromList?.page || 1,
                search: fromList?.search || '',
              },
            }}
            className={secondaryBtnClass}
          >
            Back to User Mail
          </Link>
        </div>
      </div>

      <div className={`${cardClass} p-4`}>
        {loading && <p className="text-sm text-slate-500">Loading mail history...</p>}

        {!loading && historyItems.length === 0 && (
          <p className="text-sm text-slate-500">No mail history found for this user.</p>
        )}

        {!loading && historyItems.length > 0 && (
          <div className="space-y-2">
            {historyItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.subject}</p>
                  <p className="text-xs text-slate-500">{formatDate(item.sentAt)}</p>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Status: <span className="font-semibold">{item.status}</span>
                  {item.adminName ? ` • Sent by ${item.adminName}` : ''}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{item.message}</p>
                {item.attachments?.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Attachments
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {item.attachments.map((attachment) => (
                        <div
                          key={`${item.id}-${attachment.filename}-${attachment.size}`}
                          className="flex gap-3 rounded-md border border-slate-200 bg-white p-2"
                        >
                          {attachment.url && isImageAttachment(attachment.contentType) ? (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0"
                            >
                              <img
                                src={attachment.url}
                                alt={attachment.filename}
                                className="h-14 w-14 rounded border border-slate-200 object-cover"
                              />
                            </a>
                          ) : (
                            <div
                              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded border border-slate-200 text-[10px] font-semibold uppercase ${
                                attachment.contentType === 'application/pdf'
                                  ? 'bg-red-50 text-red-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {attachment.contentType === 'application/pdf' ? 'PDF' : 'IMG'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {attachment.filename}
                            </p>
                            {attachment.size ? (
                              <p className="text-xs text-slate-500">{formatFileSize(attachment.size)}</p>
                            ) : null}
                            {attachment.url ? (
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-block text-xs font-semibold text-slate-700 underline"
                              >
                                View
                              </a>
                            ) : (
                              <p className="mt-1 text-xs text-slate-500">Sent with email</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {item.errorMessage ? (
                  <p className="mt-2 text-xs text-red-600">Error: {item.errorMessage}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <AdminAlertModal
        open={Boolean(error)}
        title="User Mail History"
        message={error}
        onClose={() => setError('')}
      />
    </section>
  )
}

export default UserMailHistory
