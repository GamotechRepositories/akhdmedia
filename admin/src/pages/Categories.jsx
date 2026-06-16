import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteCategory, fetchCategories } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import StatusBadge from '../components/StatusBadge'
import { primaryBtnClass, tableWrapClass } from '../components/ui/adminUi'

const PAGE_SIZE = 50

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const loadCategories = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetchCategories()
      setCategories(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleDelete = async (category) => {
    if (!window.confirm(`Delete category "${category.navLabel}"?`)) return

    try {
      await deleteCategory(category._id)
      await loadCategories()
    } catch (err) {
      window.alert(err.message)
    }
  }

  const totalPages = Math.max(1, Math.ceil(categories.length / PAGE_SIZE))
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return categories.slice(start, start + PAGE_SIZE)
  }, [categories, currentPage])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link to="/categories/new" className={primaryBtnClass}>
          Add Category
        </Link>
      </div>

      <div className={tableWrapClass}>
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Subcategories</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Loading categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No categories found.
                </td>
              </tr>
            ) : (
              paginatedCategories.map((category) => (
                <tr key={category._id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{category.navLabel}</td>
                  <td className="px-4 py-3 text-slate-600">{category.slug}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {category.subCategories?.length || 0}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge active={category.isActive} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/categories/${category._id}/edit`}
                      className="mr-3 font-semibold text-slate-900 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
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

      {!loading && categories.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-600">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, categories.length)} of{' '}
            {categories.length} entries
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
        title="Could not load categories"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default Categories
