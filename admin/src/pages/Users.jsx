import { useCallback, useEffect, useRef, useState } from 'react'
import AdminAlertModal from '../components/AdminAlertModal'
import AdminPagination from '../components/ui/AdminPagination'
import AdminTable from '../components/ui/AdminTable'
import {
  actionDeleteClass,
  actionGroupClass,
  cardClass,
  exportBtnClass,
  statGridClass,
  tableBodyClass,
  tableEmptyClass,
  tableHeadClass,
  tableRowClass,
  tdClass,
  tdHideMd,
  tdHideSm,
  tdPrimaryClass,
  tdRightClass,
  thClass,
  thHideMd,
  thHideSm,
  thRightClass,
} from '../components/ui/adminUi'
import { deleteUser, fetchAdminUsers, fetchUsers } from '../api/client'
import { downloadUsersExcel } from '../utils/exportUsersExcel'
import { buildPageCacheKey, createPaginatedLoader } from '../utils/paginatedPageCache'

const PAGE_SIZE = 50
const usersLoader = createPaginatedLoader()

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
  const skipSearchResetRef = useRef(true)

  const [users, setUsers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [grandTotal, setGrandTotal] = useState(0)
  const [latestSignup, setLatestSignup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingUserId, setDeletingUserId] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (skipSearchResetRef.current) {
      skipSearchResetRef.current = false
      return
    }
    setCurrentPage(1)
    usersLoader.clear()
  }, [debouncedSearch])

  const loadUsers = useCallback(
    async ({ force = false } = {}) => {
      const cacheKey = buildPageCacheKey('users', currentPage, { search: debouncedSearch })

      setLoading(true)
      setError('')

      try {
        const result = await usersLoader.load({
          cacheKey,
          force,
          fetchPage: async () => {
            const response = await fetchAdminUsers({
              page: currentPage,
              limit: PAGE_SIZE,
              search: debouncedSearch,
            })
            const payload = response.data?.data || {}
            return {
              items: payload.users || [],
              totalCount: payload.pagination?.total || 0,
              totalPages: payload.pagination?.totalPages || 1,
              grandTotal: payload.meta?.grandTotal ?? payload.pagination?.total ?? 0,
              latestSignup: payload.meta?.latestSignup ?? null,
            }
          },
        })

        setUsers(result.items)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
        setGrandTotal(result.grandTotal)
        setLatestSignup(result.latestSignup)
      } catch (loadError) {
        setError(loadError.message || 'Could not load users')
        setUsers([])
        setTotalCount(0)
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    },
    [currentPage, debouncedSearch],
  )

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleExportExcel = async () => {
    setExporting(true)
    setError('')
    try {
      const response = await fetchUsers()
      const allUsers = response.data?.data?.users || []
      if (!allUsers.length) {
        setError('No users to export')
        return
      }
      downloadUsersExcel(allUsers, { scope: 'all' })
    } catch (exportError) {
      setError(exportError.message || 'Could not export users')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name}" (${user.email})?`)) return

    setDeletingUserId(user.id)
    setError('')
    try {
      await deleteUser(user.id)
      usersLoader.clear()
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1)
      } else {
        await loadUsers({ force: true })
      }
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete user')
    } finally {
      setDeletingUserId('')
    }
  }

  const listStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const listEnd = Math.min(currentPage * PAGE_SIZE, totalCount)

  return (
    <section className="space-y-4">
      <div className={statGridClass}>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total users</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{grandTotal}</p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shown</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalCount}</p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Latest signup</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {latestSignup ? formatDate(latestSignup) : '—'}
          </p>
        </div>
      </div>

      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block min-w-0 flex-1">
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
            disabled={loading || exporting || grandTotal === 0}
            className={`${exportBtnClass} shrink-0`}
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
          Exports all {grandTotal} registered users (name, email, phone, role, joined date).
        </p>
        {!loading && (
          <p className="mt-1 text-xs text-slate-500">
            {totalCount === 0
              ? 'No users match your search.'
              : `Showing ${listStart}-${listEnd} of ${totalCount} users`}
          </p>
        )}
      </div>

      <AdminTable>
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>Name</th>
            <th className={thClass}>Email</th>
            <th className={thHideSm}>Phone</th>
            <th className={thHideMd}>Joined</th>
            <th className={thRightClass}>Actions</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading && (
            <tr>
              <td colSpan={5} className={tableEmptyClass}>
                Loading users...
              </td>
            </tr>
          )}

          {!loading && !error && users.length === 0 && (
            <tr>
              <td colSpan={5} className={tableEmptyClass}>
                No users found.
              </td>
            </tr>
          )}

          {!loading &&
            !error &&
            users.map((user) => (
              <tr key={user.id} className={tableRowClass}>
                <td className={tdPrimaryClass}>{user.name || '—'}</td>
                <td className={tdClass}>
                  <p className="break-all">{user.email || '—'}</p>
                  <p className="mt-0.5 text-xs text-slate-500 sm:hidden">{user.phone || '—'}</p>
                </td>
                <td className={tdHideSm}>{user.phone || '—'}</td>
                <td className={`${tdHideMd} text-slate-600`}>{formatDate(user.createdAt)}</td>
                <td className={tdRightClass}>
                  <div className={actionGroupClass}>
                    <button
                      type="button"
                      onClick={() => handleDelete(user)}
                      disabled={deletingUserId === user.id}
                      className={actionDeleteClass}
                    >
                      {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
        </tbody>
      </AdminTable>

      {!loading && !error && totalCount > 0 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
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
