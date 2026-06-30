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
