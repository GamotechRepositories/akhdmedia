import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminAlertModal from '../components/AdminAlertModal'
import { deleteAdminAccount, fetchAdmins } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { primaryBtnClass, tableWrapClass } from '../components/ui/adminUi'

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const Admins = () => {
  const { admin: currentAdmin } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')

  const loadAdmins = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetchAdmins()
      setAdmins(response.data?.data?.admins || [])
    } catch (loadError) {
      setError(loadError.message || 'Could not load admin accounts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  const sortedAdmins = useMemo(
    () => [...admins].sort((a, b) => Number(b.isSuperAdmin) - Number(a.isSuperAdmin)),
    [admins],
  )

  const handleDelete = async (account) => {
    if (account.isSuperAdmin) return
    if (account.id === currentAdmin?.id) return
    if (!window.confirm(`Delete admin "${account.name}" (${account.email})?`)) return

    setDeletingId(account.id)
    setError('')
    try {
      await deleteAdminAccount(account.id)
      setAdmins((current) => current.filter((entry) => entry.id !== account.id))
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete admin')
    } finally {
      setDeletingId('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Team</p>
          <h1 className="text-2xl font-bold text-slate-900">Admin Team</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create admin logins and choose which pages each person can access.
          </p>
        </div>
        <Link to="/admins/new" className={primaryBtnClass}>
          Add Admin
        </Link>
      </div>

      <AdminAlertModal open={Boolean(error)} message={error} onClose={() => setError('')} />

      <div className={tableWrapClass}>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading admin accounts...
                </td>
              </tr>
            ) : sortedAdmins.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No admin accounts yet.
                </td>
              </tr>
            ) : (
              sortedAdmins.map((account) => (
                <tr key={account.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {account.name}
                    {account.id === currentAdmin?.id ? (
                      <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{account.email}</td>
                  <td className="px-4 py-3">
                    {account.isSuperAdmin ? (
                      <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        Full access
                      </span>
                    ) : (
                      <span className="text-slate-600">
                        {account.permissions?.length || 0} permission
                        {(account.permissions?.length || 0) === 1 ? '' : 's'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(account.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admins/${account.id}/edit`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </Link>
                      {!account.isSuperAdmin && account.id !== currentAdmin?.id ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(account)}
                          disabled={deletingId === account.id}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === account.id ? 'Deleting...' : 'Delete'}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Admins
