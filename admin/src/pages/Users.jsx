import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AdminAlertModal from '../components/AdminAlertModal'
import AdminPagination from '../components/ui/AdminPagination'
import AdminTable from '../components/ui/AdminTable'
import TableLoader from '../components/ui/TableLoader'
import { IconSpinner, IconStar, IconStarFilled } from '../components/icons/AdminIcons'
import {
  actionDeleteClass,
  actionGroupClass,
  cardClass,
  exportBtnClass,
  inputClass,
  secondaryBtnClass,
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
import { deleteUser, fetchAdminUsers, fetchUsers, updateUserPremium } from '../api/client'
import { downloadUsersExcel } from '../utils/exportUsersExcel'
import { buildPageCacheKey, createPaginatedLoader } from '../utils/paginatedPageCache'

const PAGE_SIZE = 50
const usersLoader = createPaginatedLoader()

const ORDERS_FILTERS = [
  { id: 'all', label: 'All users' },
  { id: 'premium', label: '⭐ Premium customers' },
  { id: 'most', label: 'Most orders' },
  { id: 'spend', label: 'Highest spend' },
]

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

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
  const location = useLocation()
  const navigate = useNavigate()
  const tableContainerRef = useRef(null)
  const skipSearchResetRef = useRef(true)
  const pendingRestoreUserIdRef = useRef('')
  const restore = location.state?.restore

  const [users, setUsers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [grandTotal, setGrandTotal] = useState(0)
  const [premiumTotal, setPremiumTotal] = useState(0)
  const [latestSignup, setLatestSignup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(restore?.search || '')
  const [debouncedSearch, setDebouncedSearch] = useState(restore?.search || '')
  const [ordersFilter, setOrdersFilter] = useState(restore?.ordersFilter || 'all')
  const [currentPage, setCurrentPage] = useState(restore?.page || 1)
  const [highlightedId, setHighlightedId] = useState('')
  const [deletingUserId, setDeletingUserId] = useState('')
  const [togglingUserIds, setTogglingUserIds] = useState(new Set())
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

  useEffect(() => {
    setCurrentPage(1)
    usersLoader.clear()
  }, [ordersFilter])

  const loadUsers = useCallback(
    async ({ force = false } = {}) => {
      const cacheKey = buildPageCacheKey('users', currentPage, {
        search: debouncedSearch,
        orders: ordersFilter,
      })

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
              orders: ordersFilter,
            })
            const payload = response.data?.data || {}
            return {
              items: payload.users || [],
              totalCount: payload.pagination?.total || 0,
              totalPages: payload.pagination?.totalPages || 1,
              grandTotal: payload.meta?.grandTotal ?? payload.pagination?.total ?? 0,
              premiumCount: payload.meta?.premiumCount ?? 0,
              latestSignup: payload.meta?.latestSignup ?? null,
            }
          },
        })

        setUsers(result.items)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
        setGrandTotal(result.grandTotal)
        setPremiumTotal(result.premiumCount)
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
    [currentPage, debouncedSearch, ordersFilter],
  )

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    const nextRestore = location.state?.restore
    if (!nextRestore) return

    usersLoader.clear()
    pendingRestoreUserIdRef.current = nextRestore.userId || ''

    if (nextRestore.search !== undefined) {
      setSearch(nextRestore.search)
      setDebouncedSearch(nextRestore.search)
    }
    if (nextRestore.ordersFilter) setOrdersFilter(nextRestore.ordersFilter)
    if (nextRestore.page) setCurrentPage(nextRestore.page)

    navigate('/users', { replace: true, state: {} })
  }, [location.state, navigate])

  useEffect(() => {
    const userId = pendingRestoreUserIdRef.current
    if (!userId || loading) return

    const row = document.getElementById(`user-row-${userId}`)
    if (!row) return

    pendingRestoreUserIdRef.current = ''
    setHighlightedId(userId)
    row.scrollIntoView({ block: 'center', behavior: 'auto' })
    const timer = window.setTimeout(() => setHighlightedId(''), 2500)
    return () => window.clearTimeout(timer)
  }, [loading, users, currentPage])

  const handleRowClick = (user) => {
    navigate(`/users/${user.id}`, {
      state: {
        fromList: {
          search,
          ordersFilter,
          page: currentPage,
          userId: user.id,
        },
      },
    })
  }

  const handleTogglePremium = async (event, user) => {
    event.stopPropagation()
    const targetId = user.id
    const nextIsPremium = !user.isPremium

    // Optimistic UI state
    setUsers((prev) =>
      prev.map((u) => (u.id === targetId ? { ...u, isPremium: nextIsPremium } : u)),
    )
    setPremiumTotal((prev) => Math.max(0, prev + (nextIsPremium ? 1 : -1)))
    setTogglingUserIds((prev) => new Set([...prev, targetId]))

    try {
      const response = await updateUserPremium(targetId, nextIsPremium)
      const updatedUser = response.data?.data?.user
      if (updatedUser) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetId ? { ...u, ...updatedUser } : u)),
        )
      }
      usersLoader.clear()
      await loadUsers({ force: true })
    } catch (toggleError) {
      // Revert optimistic state
      setUsers((prev) =>
        prev.map((u) => (u.id === targetId ? { ...u, isPremium: user.isPremium } : u)),
      )
      setPremiumTotal((prev) => Math.max(0, prev + (user.isPremium ? 1 : -1)))
      setError(toggleError.message || 'Could not update premium customer status')
    } finally {
      setTogglingUserIds((prev) => {
        const next = new Set(prev)
        next.delete(targetId)
        return next
      })
    }
  }

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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total users</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{grandTotal}</p>
        </div>
        <div className={`${cardClass} border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-4`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
              Premium customers
            </p>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <IconStarFilled className="h-3.5 w-3.5" />
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold text-amber-900">{premiumTotal}</p>
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
              className={inputClass}
            />
          </label>
          <label className="block w-full sm:w-56">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Filter / Sort
            </span>
            <select
              value={ordersFilter}
              onChange={(event) => setOrdersFilter(event.target.value)}
              className={inputClass}
            >
              {ORDERS_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link to="/user-mail" className={secondaryBtnClass}>
              Send Email
            </Link>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={loading || exporting || grandTotal === 0}
              className={exportBtnClass}
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

      <AdminTable ref={tableContainerRef}>
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>Customer</th>
            <th className={thClass}>Email</th>
            <th className={thHideSm}>Phone</th>
            <th className={thClass}>Orders</th>
            <th className={thClass}>Total spent</th>
            <th className={thHideMd}>Joined</th>
            <th className={thRightClass}>Actions</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading && (
            <TableLoader label="Loading users..." colSpan={7} className={tableEmptyClass} />
          )}

          {!loading && !error && users.length === 0 && (
            <tr>
              <td colSpan={7} className={tableEmptyClass}>
                No users found.
              </td>
            </tr>
          )}

          {!loading &&
            !error &&
            users.map((user) => {
              const isPremium = Boolean(user.isPremium)
              const isToggling = togglingUserIds.has(user.id)

              return (
                <tr
                  key={user.id}
                  id={`user-row-${user.id}`}
                  className={`${tableRowClass} cursor-pointer ${
                    isPremium ? 'bg-amber-50/35 hover:bg-amber-50/70 border-l-2 border-l-amber-400' : ''
                  } ${
                    highlightedId === user.id ? 'bg-amber-100/70 ring-1 ring-inset ring-amber-300' : ''
                  }`}
                  onClick={() => handleRowClick(user)}
                >
                  <td className={tdPrimaryClass}>
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        aria-label={isPremium ? 'Remove from Premium' : 'Mark as Premium'}
                        title={isPremium ? '⭐ Premium customer (click to remove)' : 'Click star to mark as Premium customer'}
                        onClick={(event) => handleTogglePremium(event, user)}
                        disabled={isToggling}
                        className={`group relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition ${
                          isPremium
                            ? 'border-amber-300 bg-amber-50 text-amber-500 shadow-xs hover:border-amber-400 hover:bg-amber-100 hover:scale-110'
                            : 'border-slate-200 bg-white text-slate-300 hover:border-amber-300 hover:text-amber-500 hover:bg-amber-50/50 hover:scale-110'
                        }`}
                      >
                        {isToggling ? (
                          <IconSpinner className="h-4 w-4 text-amber-500" />
                        ) : isPremium ? (
                          <IconStarFilled className="h-4 w-4 text-amber-500" />
                        ) : (
                          <IconStar className="h-4 w-4 transition group-hover:text-amber-500" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900">{user.name || '—'}</span>
                          {isPremium && (
                            <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-300 bg-amber-100/90 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-800 shadow-2xs">
                              ⭐ Premium
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={tdClass}>
                    <p className="break-all">{user.email || '—'}</p>
                    <p className="mt-0.5 text-xs text-slate-500 sm:hidden">{user.phone || '—'}</p>
                  </td>
                  <td className={tdHideSm}>{user.phone || '—'}</td>
                  <td className={`${tdClass} font-semibold text-slate-900`}>
                    {Number(user.orderCount) || 0}
                  </td>
                  <td className={`${tdClass} font-semibold text-emerald-700`}>
                    {formatCurrency(user.totalSpent)}
                  </td>
                  <td className={`${tdHideMd} text-slate-600`}>{formatDate(user.createdAt)}</td>
                  <td className={tdRightClass}>
                    <div className={actionGroupClass}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleDelete(user)
                        }}
                        disabled={deletingUserId === user.id}
                        className={actionDeleteClass}
                      >
                        {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
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
