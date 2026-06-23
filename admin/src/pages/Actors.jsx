import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteActor, fetchAdminActors, fetchSiteContent, updateSiteContent } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import StatusBadge from '../components/StatusBadge'
import AdminPagination from '../components/ui/AdminPagination'
import AdminTable from '../components/ui/AdminTable'
import TableLoader from '../components/ui/TableLoader'
import { ADMIN_PERMISSIONS } from '../constants/adminPermissions'
import { useAuth } from '../context/AuthContext'
import {
  actionDeleteClass,
  actionEditClass,
  actionGroupClass,
  cardClass,
  inputClass,
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
import { buildPageCacheKey, createPaginatedLoader } from '../utils/paginatedPageCache'

const PAGE_SIZE = 50
const actorsLoader = createPaginatedLoader()

const Actors = () => {
  const { hasPermission } = useAuth()
  const canManageHomeContent = hasPermission(ADMIN_PERMISSIONS.HOME_CONTENT_MANAGE)
  const canWriteActors = hasPermission(ADMIN_PERMISSIONS.ACTORS_WRITE)
  const skipSearchResetRef = useRef(true)

  const [actors, setActors] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showActorsSection, setShowActorsSection] = useState(true)
  const [savingVisibility, setSavingVisibility] = useState(false)
  const [visibilityNotice, setVisibilityNotice] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

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
    actorsLoader.clear()
  }, [debouncedSearch])

  const loadActors = useCallback(
    async ({ force = false } = {}) => {
      const cacheKey = buildPageCacheKey('actors', currentPage, { search: debouncedSearch })

      setLoading(true)
      setError('')

      try {
        const result = await actorsLoader.load({
          cacheKey,
          force,
          fetchPage: async () => {
            const response = await fetchAdminActors({
              page: currentPage,
              limit: PAGE_SIZE,
              search: debouncedSearch,
            })
            const payload = response.data?.data || {}
            return {
              items: payload.actors || [],
              totalCount: payload.pagination?.total || 0,
              totalPages: payload.pagination?.totalPages || 1,
            }
          },
        })

        setActors(result.items)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
      } catch (err) {
        setError(err.message)
        setActors([])
        setTotalCount(0)
        setTotalPages(1)
      } finally {
        setLoading(false)
      }
    },
    [currentPage, debouncedSearch],
  )

  useEffect(() => {
    const loadSiteContent = async () => {
      if (!canManageHomeContent) return
      try {
        const siteContentResponse = await fetchSiteContent()
        setShowActorsSection(siteContentResponse.data?.showActorsSection !== false)
      } catch {
        // non-blocking
      }
    }

    loadSiteContent()
  }, [canManageHomeContent])

  useEffect(() => {
    loadActors()
  }, [loadActors])

  const handleDelete = async (actor) => {
    if (!window.confirm(`Delete actor "${actor.name}"?`)) return

    try {
      await deleteActor(actor._id)
      actorsLoader.clear()
      if (actors.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1)
      } else {
        await loadActors({ force: true })
      }
    } catch (err) {
      window.alert(err.message)
    }
  }

  const handleToggleHomepageVisibility = async () => {
    const nextValue = !showActorsSection
    setSavingVisibility(true)
    setVisibilityNotice('')
    setError('')

    try {
      await updateSiteContent({ showActorsSection: nextValue })
      setShowActorsSection(nextValue)
      setVisibilityNotice(
        nextValue
          ? 'Actors section is now visible on the homepage.'
          : 'Actors section is hidden from the homepage.',
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingVisibility(false)
    }
  }

  const listStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const listEnd = Math.min(currentPage * PAGE_SIZE, totalCount)

  return (
    <div className="space-y-4">
      <AdminAlertModal
        open={Boolean(error)}
        title="Could not load actors"
        message={error}
        onClose={() => setError('')}
      />

      {canManageHomeContent ? (
        <div className={`${cardClass} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Show Actors section on homepage</p>
            <p className="mt-1 text-sm text-slate-500">
              Turn off to hide the full Actors rail from the storefront home page.
            </p>
            {visibilityNotice ? (
              <p className="mt-2 text-sm font-medium text-emerald-700">{visibilityNotice}</p>
            ) : null}
          </div>
          <label className="inline-flex shrink-0 cursor-pointer items-center gap-3">
            <span className="text-sm font-medium text-slate-700">
              {showActorsSection ? 'Visible' : 'Hidden'}
            </span>
            <input
              type="checkbox"
              checked={showActorsSection}
              onChange={handleToggleHomepageVisibility}
              disabled={loading || savingVisibility}
              className="h-5 w-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900/20 disabled:opacity-60"
            />
          </label>
        </div>
      ) : null}

      <div className={`${cardClass} p-4`}>
        <div className="flex flex-row items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or keywords..."
            className={`${inputClass} mt-0 min-w-0 flex-1`}
          />
          {canWriteActors ? (
            <Link to="/actors/new" className={`${primaryBtnClass} !w-auto shrink-0`}>
              Add Actor
            </Link>
          ) : null}
        </div>
        {!loading && (
          <p className="mt-2 text-xs text-slate-500">
            {totalCount === 0
              ? 'No actors match your search.'
              : `Showing ${listStart}-${listEnd} of ${totalCount} actors`}
          </p>
        )}
      </div>

      <AdminTable>
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>Order</th>
            <th className={thClass}>Image</th>
            <th className={thClass}>Name</th>
            <th className={thHideMd}>Keywords</th>
            <th className={thClass}>Status</th>
            <th className={thRightClass}>Actions</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading ? (
            <TableLoader label="Loading actors..." colSpan={6} className={tableEmptyClass} />
          ) : actors.length === 0 ? (
            <tr>
              <td colSpan={6} className={tableEmptyClass}>
                {search.trim() ? 'No actors match your search.' : 'No actors yet.'}
              </td>
            </tr>
          ) : (
            actors.map((actor) => (
              <tr key={actor._id} className={tableRowClass}>
                <td className={`${tdClass} font-medium`}>{actor.sortOrder ?? 0}</td>
                <td className={tdClass}>
                  {actor.image ? (
                    <img
                      src={actor.image}
                      alt={actor.name}
                      className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200 sm:h-12 sm:w-12"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400 sm:h-12 sm:w-12">
                      —
                    </div>
                  )}
                </td>
                <td className={tdPrimaryClass}>
                  <p>{actor.name}</p>
                  {actor.searchKeywords?.length ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 md:hidden">
                      {actor.searchKeywords.join(', ')}
                    </p>
                  ) : null}
                </td>
                <td className={`${tdHideMd} max-w-xs text-slate-600`}>
                  {actor.searchKeywords?.length ? actor.searchKeywords.join(', ') : '—'}
                </td>
                <td className={tdClass}>
                  <StatusBadge active={actor.isActive} />
                </td>
                <td className={tdRightClass}>
                  {canWriteActors ? (
                    <div className={actionGroupClass}>
                      <Link to={`/actors/${actor._id}/edit`} className={actionEditClass}>
                        Edit
                      </Link>
                      <button type="button" onClick={() => handleDelete(actor)} className={actionDeleteClass}>
                        Delete
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400">View only</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>

      {!loading && totalCount > 0 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemLabel="actors"
        />
      )}
    </div>
  )
}

export default Actors
