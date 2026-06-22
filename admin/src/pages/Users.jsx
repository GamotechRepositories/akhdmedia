import { useEffect, useMemo, useState } from 'react'
import AdminAlertModal from '../components/AdminAlertModal'
import { secondaryBtnClass, tableWrapClass } from '../components/ui/adminUi'
import { deleteUser, fetchUsers } from '../api/client'
import { downloadUsersExcel } from '../utils/exportUsersExcel'

const PAGE_SIZE = 50

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

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingUserId, setDeletingUserId] = useState('')
  const [exporting, setExporting] = useState(false)

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetchUsers()
      setUsers(response.data?.data?.users || [])
    } catch (loadError) {
      setError(loadError.message || 'Could not load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleExportExcel = () => {
    if (!users.length) {
      setError('No users to export')
      return
    }

    setExporting(true)
    try {
      downloadUsersExcel(users, { scope: 'all' })
    } catch (exportError) {
      setError(exportError.message || 'Could not export users')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async (user) => {
    if (user.role === 'admin') return

    if (!window.confirm(`Delete user "${user.name}" (${user.email})?`)) return

    setDeletingUserId(user.id)
    setError('')
    try {
      await deleteUser(user.id)
      setUsers((current) => current.filter((entry) => entry.id !== user.id))
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete user')
    } finally {
      setDeletingUserId('')
    }
  }

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users
    return users.filter((user) =>
      [user.name, user.email, user.phone].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(term),
      ),
    )
  }, [search, users])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [filteredUsers, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total users</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{users.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shown</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{filteredUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest signup</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {users[0]?.createdAt ? formatDate(users[0].createdAt) : '—'}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block flex-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search users
            </span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, phone"
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
            />
          </label>
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={loading || exporting || users.length === 0}
            className={`${secondaryBtnClass} shrink-0 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {exporting ? 'Exporting...' : 'Download Excel'}
            </span>
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Exports all {users.length} registered users (name, email, phone, role, joined date).
        </p>
      </div>

      <div className={tableWrapClass}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Email</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">Joined</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              )}

              {!loading && !error && filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-semibold text-slate-900">{user.name || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{user.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{user.phone || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {user.role === 'admin' ? (
                        <span className="text-xs font-medium text-slate-400">Admin</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          disabled={deletingUserId === user.id}
                          className="text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
                        >
                          {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && !error && filteredUsers.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredUsers.length)} of{' '}
            {filteredUsers.length} entries
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AdminAlertModal
        open={Boolean(error)}
        title="Users"
        message={error}
        onClose={() => setError('')}
      />
    </section>
  )
}

export default Users
