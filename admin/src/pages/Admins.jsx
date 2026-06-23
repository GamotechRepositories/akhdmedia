import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminAlertModal from '../components/AdminAlertModal'
import AdminPageHeader from '../components/ui/AdminPageHeader'
import AdminTable from '../components/ui/AdminTable'
import TableLoader from '../components/ui/TableLoader'
import { deleteAdminAccount, fetchAdmins } from '../api/client'
import { useAuth } from '../context/AuthContext'
import {
  actionDeleteClass,
  actionEditClass,
  actionGroupClass,
  primaryBtnClass,
  tableBodyClass,
  tableEmptyClass,
  tableHeadClass,
  tableRowClass,
  tdClass,
  tdHideMd,
  tdPrimaryClass,
  tdRightClass,
  thClass,
  thHideMd,
  thRightClass,
} from '../components/ui/adminUi'

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
      <AdminPageHeader
        eyebrow="Team"
        title="Admin Team"
        description="Create admin logins and choose which pages each person can access."
        action={
          <Link to="/admins/new" className={primaryBtnClass}>
            Add Admin
          </Link>
        }
      />

      <AdminAlertModal open={Boolean(error)} message={error} onClose={() => setError('')} />

      <AdminTable>
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>Name</th>
            <th className={thClass}>Email</th>
            <th className={thClass}>Access</th>
            <th className={thHideMd}>Created</th>
            <th className={thRightClass}>Actions</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading ? (
            <TableLoader label="Loading admin accounts..." colSpan={5} className={tableEmptyClass} />
          ) : sortedAdmins.length === 0 ? (
            <tr>
              <td colSpan={5} className={tableEmptyClass}>
                No admin accounts yet.
              </td>
            </tr>
          ) : (
            sortedAdmins.map((account) => (
              <tr key={account.id} className={tableRowClass}>
                <td className={tdPrimaryClass}>
                  {account.name}
                  {account.id === currentAdmin?.id ? (
                    <span className="ml-2 text-xs font-normal text-slate-400">(you)</span>
                  ) : null}
                </td>
                <td className={`${tdClass} break-all text-slate-600`}>{account.email}</td>
                <td className={tdClass}>
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
                <td className={`${tdHideMd} text-slate-500`}>{formatDate(account.createdAt)}</td>
                <td className={tdRightClass}>
                  <div className={actionGroupClass}>
                    <Link to={`/admins/${account.id}/edit`} className={actionEditClass}>
                      Edit
                    </Link>
                    {!account.isSuperAdmin && account.id !== currentAdmin?.id ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(account)}
                        disabled={deletingId === account.id}
                        className={actionDeleteClass}
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
      </AdminTable>
    </div>
  )
}

export default Admins
