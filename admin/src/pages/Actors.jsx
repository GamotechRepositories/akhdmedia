import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteActor, fetchActors, fetchSiteContent, updateSiteContent } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import StatusBadge from '../components/StatusBadge'
import { ADMIN_PERMISSIONS } from '../constants/adminPermissions'
import { useAuth } from '../context/AuthContext'
import { cardClass, inputClass, primaryBtnClass, tableWrapClass } from '../components/ui/adminUi'

const PAGE_SIZE = 50

const Actors = () => {
  const { hasPermission } = useAuth()
  const canManageHomeContent = hasPermission(ADMIN_PERMISSIONS.HOME_CONTENT_MANAGE)
  const canWriteActors = hasPermission(ADMIN_PERMISSIONS.ACTORS_WRITE)
  const [actors, setActors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showActorsSection, setShowActorsSection] = useState(true)
  const [savingVisibility, setSavingVisibility] = useState(false)
  const [visibilityNotice, setVisibilityNotice] = useState('')
  const [search, setSearch] = useState('')

  const loadActors = async () => {
    setLoading(true)
    setError('')
    try {
      const actorsResponse = await fetchActors()
      setActors(actorsResponse.data)

      if (canManageHomeContent) {
        const siteContentResponse = await fetchSiteContent()
        setShowActorsSection(siteContentResponse.data?.showActorsSection !== false)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActors()
  }, [canManageHomeContent])

  const handleDelete = async (actor) => {
    if (!window.confirm(`Delete actor "${actor.name}"?`)) return

    try {
      await deleteActor(actor._id)
      await loadActors()
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

  const filteredActors = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return actors

    return actors.filter((actor) => {
      const haystack = [
        actor.name,
        ...(actor.searchKeywords || []),
        String(actor.sortOrder ?? ''),
        actor.isActive ? 'active' : 'inactive',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [actors, search])

  const totalPages = Math.max(1, Math.ceil(filteredActors.length / PAGE_SIZE))
  const paginatedActors = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredActors.slice(start, start + PAGE_SIZE)
  }, [filteredActors, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

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
          <div>
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or keywords..."
            className={`${inputClass} mt-0 sm:max-w-md`}
          />
          {canWriteActors ? (
            <Link to="/actors/new" className={primaryBtnClass}>
              Add Actor
            </Link>
          ) : null}
        </div>
      </div>

      <div className={tableWrapClass}>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Order (0+)</th>
              <th className="px-4 py-3">Image</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Search keywords</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading actors...
                </td>
              </tr>
            ) : filteredActors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {search.trim() ? 'No actors match your search.' : 'No actors yet.'}
                </td>
              </tr>
            ) : (
              paginatedActors.map((actor) => (
                <tr key={actor._id}>
                  <td className="px-4 py-3 font-medium text-slate-700">{actor.sortOrder ?? 0}</td>
                  <td className="px-4 py-3">
                    {actor.image ? (
                      <img
                        src={actor.image}
                        alt={actor.name}
                        className="h-12 w-12 rounded-full object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">
                        —
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{actor.name}</td>
                  <td className="max-w-xs px-4 py-3 text-slate-600">
                    {actor.searchKeywords?.length ? actor.searchKeywords.join(', ') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge active={actor.isActive} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canWriteActors ? (
                      <>
                        <Link
                          to={`/actors/${actor._id}/edit`}
                          className="mr-3 font-semibold text-slate-900 hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(actor)}
                          className="font-semibold text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      <span className="text-slate-400">View only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && filteredActors.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <p>
            Showing {(currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, filteredActors.length)} of {filteredActors.length} actors
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <p>
            Page {currentPage} of {totalPages}
          </p>
        </div>
      )}
    </div>
  )
}

export default Actors
