import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteActor, fetchActors } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import StatusBadge from '../components/StatusBadge'
import { primaryBtnClass, tableWrapClass } from '../components/ui/adminUi'

const PAGE_SIZE = 50

const Actors = () => {
  const [actors, setActors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const loadActors = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetchActors()
      setActors(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActors()
  }, [])

  const handleDelete = async (actor) => {
    if (!window.confirm(`Delete actor "${actor.name}"?`)) return

    try {
      await deleteActor(actor._id)
      await loadActors()
    } catch (err) {
      window.alert(err.message)
    }
  }

  const totalPages = Math.max(1, Math.ceil(actors.length / PAGE_SIZE))
  const paginatedActors = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return actors.slice(start, start + PAGE_SIZE)
  }, [actors, currentPage])

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

      <div className="flex justify-end">
        <Link to="/actors/new" className={primaryBtnClass}>
          Add Actor
        </Link>
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
            ) : actors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No actors yet.
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && actors.length > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <p>
            Page {currentPage} of {totalPages}
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
        </div>
      )}
    </div>
  )
}

export default Actors
