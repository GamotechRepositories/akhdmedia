import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDeletedAccounts } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import AdminPagination from '../components/ui/AdminPagination'
import AdminTable from '../components/ui/AdminTable'
import TableLoader from '../components/ui/TableLoader'
import {
  cardClass,
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
import { buildPageCacheKey, createPaginatedLoader } from '../utils/paginatedPageCache'

const PAGE_SIZE = 50
const deletedAccountsLoader = createPaginatedLoader()

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

const DeletedAccounts = () => {
  const tableContainerRef = useRef(null)
  const skipSearchResetRef = useRef(true)

  const [accounts, setAccounts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

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
    deletedAccountsLoader.clear()
  }, [debouncedSearch])

  const loadAccounts = useCallback(
    async ({ force = false } = {}) => {
      const cacheKey = buildPageCacheKey('deleted-accounts', currentPage, {
        search: debouncedSearch,
      })

      setLoading(true)
      setError('')

      try {
        const result = await deletedAccountsLoader.load({
          cacheKey,
          force,
          fetchPage: async () => {
            const response = await fetchDeletedAccounts({
              page: currentPage,
              limit: PAGE_SIZE,
              search: debouncedSearch,
            })
            const payload = response.data?.data || {}
            return {
              items: payload.accounts || [],
              totalCount: payload.pagination?.total || 0,
              totalPages: payload.pagination?.totalPages || 1,
            }
          },
        })

        setAccounts(result.items)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
      } catch (loadError) {
        setError(loadError.message || 'Could not load deleted accounts')
        setAccounts([])
        setTotalCount(0)
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    },
    [currentPage, debouncedSearch],
  )

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  const listStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const listEnd = Math.min(currentPage * PAGE_SIZE, totalCount)

  return (
    <section className="space-y-4">
      <div className={statGridClass}>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Deleted accounts
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{totalCount}</p>
        </div>
        <div className={`${cardClass} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Showing</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {totalCount === 0 ? '0' : `${listStart}–${listEnd}`}
          </p>
        </div>
      </div>

      <div className={`${cardClass} p-4`}>
        <label className="block min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search deleted accounts
          </span>
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, phone, reason"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
          />
        </label>
      </div>

      <AdminTable ref={tableContainerRef}>
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>Name</th>
            <th className={thHideSm}>Email</th>
            <th className={thHideMd}>Phone</th>
            <th className={thClass}>Reason</th>
            <th className={thHideSm}>Deleted by</th>
            <th className={thClass}>Deleted at</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading ? (
            <TableLoader label="Loading deleted accounts..." colSpan={6} className={tableEmptyClass} />
          ) : accounts.length === 0 ? (
            <tr>
              <td colSpan={6} className={tableEmptyClass}>
                No deleted accounts found
              </td>
            </tr>
          ) : (
            accounts.map((account) => (
              <tr key={account.id} className={tableRowClass}>
                <td className={tdPrimaryClass}>{account.name || '—'}</td>
                <td className={tdHideSm}>{account.email || '—'}</td>
                <td className={tdHideMd}>{account.phone || '—'}</td>
                <td className={tdClass}>
                  <span className="line-clamp-2 max-w-xs" title={account.reason}>
                    {account.reason || '—'}
                  </span>
                </td>
                <td className={tdHideSm}>
                  {account.deletedBy === 'admin'
                    ? `Admin${account.deletedByAdminName ? ` · ${account.deletedByAdminName}` : ''}`
                    : 'User'}
                </td>
                <td className={tdClass}>{formatDate(account.deletedAt)}</td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>

      {!loading && !error && totalCount > 0 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemLabel="deleted accounts"
        />
      )}

      <AdminAlertModal
        open={Boolean(error)}
        title="Deleted Accounts"
        message={error}
        onClose={() => setError('')}
      />
    </section>
  )
}

export default DeletedAccounts
