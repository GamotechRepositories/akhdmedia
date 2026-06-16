import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteCategory, fetchCategories } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { primaryBtnClass, tableWrapClass } from '../components/ui/adminUi'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Navbar links and subcategories are managed here."
        action={
          <Link to="/categories/new" className={primaryBtnClass}>
            Add Category
          </Link>
        }
      />

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
              categories.map((category) => (
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
