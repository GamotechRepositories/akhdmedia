import { Link } from 'react-router-dom'
import { getFirstAllowedPath } from '../constants/adminPermissions'
import { useAuth } from '../context/AuthContext'
import { secondaryBtnClass } from '../components/ui/adminUi'

const AccessDenied = () => {
  const { admin } = useAuth()
  const fallback = getFirstAllowedPath(admin)

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m0 0v2m0-2h2m-2 0H10m4-6V7a4 4 0 10-8 0v4m12 0H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2z"
          />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-bold text-slate-900">Access denied</h1>
      <p className="mt-2 text-sm text-slate-500">
        Your admin account does not have permission to open this page. Contact the super admin if
        you need access.
      </p>
      {fallback !== '/access-denied' ? (
        <Link to={fallback} className={`${secondaryBtnClass} mt-6 inline-flex`}>
          Go to allowed page
        </Link>
      ) : null}
    </div>
  )
}

export default AccessDenied
