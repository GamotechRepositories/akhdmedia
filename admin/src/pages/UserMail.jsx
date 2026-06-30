import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminAlertModal from '../components/AdminAlertModal'
import AdminPagination from '../components/ui/AdminPagination'
import AdminTable from '../components/ui/AdminTable'
import TableLoader from '../components/ui/TableLoader'
import {
  cardClass,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
  statGridClass,
  tableBodyClass,
  tableEmptyClass,
  tableHeadClass,
  tableRowClass,
  tdClass,
  tdHideMd,
  tdHideSm,
  tdPrimaryClass,
  thClass,
  thHideMd,
  thHideSm,
} from '../components/ui/adminUi'
import {
  fetchAdminUsers,
  fetchUsers,
  fetchUsersSelection,
  saveUsersSelection,
  sendUsersEmail,
} from '../api/client'
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

const UserMail = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const tableContainerRef = useRef(null)
  const skipSearchResetRef = useRef(true)
  const saveSelectionTimeoutRef = useRef(null)
  const pendingRestoreUserIdRef = useRef('')
  const restore = location.state?.restore

  const [users, setUsers] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [grandTotal, setGrandTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(restore?.search || '')
  const [debouncedSearch, setDebouncedSearch] = useState(restore?.search || '')
  const [currentPage, setCurrentPage] = useState(restore?.page || 1)
  const [highlightedId, setHighlightedId] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [mailing, setMailing] = useState(false)
  const [selectionReady, setSelectionReady] = useState(false)
  const [selectingAll, setSelectingAll] = useState(false)

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
      const cacheKey = buildPageCacheKey('user-mail', currentPage, { search: debouncedSearch })

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
            }
          },
        })

        setUsers(result.items)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
        setGrandTotal(result.grandTotal)
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

  useEffect(() => {
    const nextRestore = location.state?.restore
    if (!nextRestore) return

    usersLoader.clear()
    pendingRestoreUserIdRef.current = nextRestore.userId || ''

    if (nextRestore.search !== undefined) {
      setSearch(nextRestore.search)
      setDebouncedSearch(nextRestore.search)
    }
    if (nextRestore.page) setCurrentPage(nextRestore.page)

    navigate('/user-mail', { replace: true, state: {} })
  }, [location.state, navigate])

  useEffect(() => {
    const userId = pendingRestoreUserIdRef.current
    if (!userId || loading) return

    const row = document.getElementById(`user-mail-row-${userId}`)
    if (!row) return

    pendingRestoreUserIdRef.current = ''
    setHighlightedId(userId)
    row.scrollIntoView({ block: 'center', behavior: 'auto' })
    const timer = window.setTimeout(() => setHighlightedId(''), 2500)
    return () => window.clearTimeout(timer)
  }, [loading, users, currentPage])

  useEffect(() => {
    let active = true

    const loadSavedSelection = async () => {
      try {
        const response = await fetchUsersSelection()
        if (!active) return
        setSelectedUserIds(response.data?.data?.userIds || [])
      } catch {
        // keep empty selection on load if restore fails
      } finally {
        if (active) setSelectionReady(true)
      }
    }

    loadSavedSelection()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!selectionReady) return

    if (saveSelectionTimeoutRef.current) {
      window.clearTimeout(saveSelectionTimeoutRef.current)
    }

    saveSelectionTimeoutRef.current = window.setTimeout(async () => {
      try {
        await saveUsersSelection({ userIds: selectedUserIds })
      } catch {
        // ignore autosave failures
      }
    }, 350)

    return () => {
      if (saveSelectionTimeoutRef.current) {
        window.clearTimeout(saveSelectionTimeoutRef.current)
      }
    }
  }, [selectedUserIds, selectionReady])

  const allPageUserIds = users.map((user) => user.id)
  const selectedOnPageCount = allPageUserIds.filter((id) => selectedUserIds.includes(id)).length
  const allOnPageSelected = users.length > 0 && selectedOnPageCount === users.length
  const allUsersSelected = grandTotal > 0 && selectedUserIds.length === grandTotal

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const togglePageSelection = () => {
    setSelectedUserIds((prev) => {
      if (allOnPageSelected) {
        return prev.filter((id) => !allPageUserIds.includes(id))
      }
      return [...new Set([...prev, ...allPageUserIds])]
    })
  }

  const handleSelectAllUsers = async () => {
    if (allUsersSelected) {
      await clearSelectedUsers()
      return
    }

    setSelectingAll(true)
    setError('')
    try {
      const response = await fetchUsers()
      const allUsers = response.data?.data?.users || []
      setSelectedUserIds(allUsers.map((user) => user.id))
    } catch (selectError) {
      setError(selectError.message || 'Could not select all users')
    } finally {
      setSelectingAll(false)
    }
  }

  const clearSelectedUsers = async () => {
    setSelectedUserIds([])
    try {
      await saveUsersSelection({ userIds: [] })
    } catch {
      // ignore
    }
  }

  const validateEmailDraft = () => {
    if (emailSubject.trim().length < 3) {
      setError('Email subject must be at least 3 characters.')
      return false
    }
    if (emailMessage.trim().length < 5) {
      setError('Email message must be at least 5 characters.')
      return false
    }
    return true
  }

  const sendEmail = async (payload, confirmMessage) => {
    if (!validateEmailDraft()) return
    if (!window.confirm(confirmMessage)) return

    setMailing(true)
    setError('')
    try {
      const response = await sendUsersEmail({
        ...payload,
        subject: emailSubject.trim(),
        message: emailMessage.trim(),
      })
      const summary = response.data?.message || 'Email sent successfully.'
      const failedCount = Number(response.data?.data?.failedCount || 0)

      usersLoader.clear()
      await loadUsers({ force: true })
      setSelectedUserIds([])
      setEmailSubject('')
      setEmailMessage('')

      if (failedCount > 0) {
        setError(`${summary} ${failedCount} failed. Please check logs.`)
      } else {
        window.alert(summary)
      }
    } catch (sendError) {
      setError(sendError.message || 'Could not send email')
    } finally {
      setMailing(false)
    }
  }

  const handleSendMail = () => {
    if (selectedUserIds.length === 0) {
      setError('Please select at least one user to send mail.')
      return
    }
    return sendEmail(
      { target: 'selected', userIds: selectedUserIds },
      `Send this email to ${selectedUserIds.length} selected user(s)?`,
    )
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
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{selectedUserIds.length}</p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ready to send</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{selectedUserIds.length}</p>
        </div>
      </div>

      <div className={`${cardClass} space-y-3 p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Compose email
          </p>
          <p className="text-xs text-slate-500">
            Selected: <span className="font-semibold text-slate-700">{selectedUserIds.length}</span>
          </p>
        </div>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</span>
          <input
            type="text"
            value={emailSubject}
            onChange={(event) => setEmailSubject(event.target.value)}
            placeholder="Enter email subject"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</span>
          <textarea
            value={emailMessage}
            onChange={(event) => setEmailMessage(event.target.value)}
            rows={6}
            placeholder="Type email message..."
            className={inputClass}
          />
        </label>

        <p className="text-xs text-slate-500">
          {selectedUserIds.length > 0
            ? `Send Mail will email ${selectedUserIds.length} selected user(s).`
            : 'No users selected — Send Mail count is 0.'}
        </p>

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={clearSelectedUsers}
            disabled={mailing || selectedUserIds.length === 0}
            className={secondaryBtnClass}
          >
            Clear Selected
          </button>
          <button
            type="button"
            onClick={handleSendMail}
            disabled={mailing || loading || selectedUserIds.length === 0}
            className={`${primaryBtnClass} sm:min-w-[12rem]`}
          >
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {mailing ? 'Sending...' : `Send Mail (${selectedUserIds.length})`}
            </span>
          </button>
        </div>
      </div>

      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <label className="block min-w-0 flex-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search recipients
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
            onClick={handleSelectAllUsers}
            disabled={loading || selectingAll || grandTotal === 0}
            className={secondaryBtnClass}
          >
            {selectingAll
              ? 'Selecting...'
              : allUsersSelected
                ? `Deselect All (${grandTotal})`
                : `Select All (${grandTotal})`}
          </button>
        </div>
        {!loading && (
          <p className="mt-2 text-xs text-slate-500">
            {totalCount === 0
              ? 'No users match your search.'
              : `Showing ${listStart}-${listEnd} of ${totalCount} users`}
          </p>
        )}
      </div>

      <AdminTable ref={tableContainerRef}>
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={togglePageSelection}
                  onClick={(event) => event.stopPropagation()}
                />
                <span>Select</span>
              </label>
            </th>
            <th className={thClass}>Name</th>
            <th className={thClass}>Email</th>
            <th className={thHideSm}>Phone</th>
            <th className={thHideMd}>Joined</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading && (
            <TableLoader label="Loading users..." colSpan={5} className={tableEmptyClass} />
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
              <tr
                key={user.id}
                id={`user-mail-row-${user.id}`}
                className={`${tableRowClass} cursor-pointer ${
                  highlightedId === user.id ? 'bg-amber-50 ring-1 ring-inset ring-amber-200' : ''
                }`}
                onClick={() =>
                  navigate(`/user-mail/${user.id}`, {
                    state: {
                      fromList: {
                        search,
                        page: currentPage,
                        userId: user.id,
                      },
                    },
                  })
                }
              >
                <td className={tdClass}>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    onClick={(event) => event.stopPropagation()}
                  />
                </td>
                <td className={tdPrimaryClass}>{user.name || '—'}</td>
                <td className={tdClass}>
                  <p className="break-all">{user.email || '—'}</p>
                  <p className="mt-0.5 text-xs text-slate-500 sm:hidden">{user.phone || '—'}</p>
                </td>
                <td className={tdHideSm}>{user.phone || '—'}</td>
                <td className={`${tdHideMd} text-slate-600`}>{formatDate(user.createdAt)}</td>
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
        title="User Mail"
        message={error}
        onClose={() => setError('')}
      />
    </section>
  )
}

export default UserMail
