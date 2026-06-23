import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteCategory, fetchCategories } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import StatusBadge from '../components/StatusBadge'
import AdminPageHeader from '../components/ui/AdminPageHeader'
import AdminPagination from '../components/ui/AdminPagination'
import AdminTable from '../components/ui/AdminTable'
import {
  actionDeleteClass,
  actionEditClass,
  actionGroupClass,
  primaryBtnClass,
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
      <AdminPageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Manage navigation groups and subcategories for the storefront."
        action={
          <Link to="/categories/new" className={primaryBtnClass}>
            Add Category
          </Link>
        }
      />

      <AdminTable>
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>Name</th>
            <th className={thHideSm}>Home browse</th>
            <th className={thHideMd}>Slug</th>
            <th className={thHideSm}>Subcategories</th>
            <th className={thClass}>Status</th>
            <th className={thRightClass}>Actions</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading ? (
            <tr>
              <td colSpan={6} className={tableEmptyClass}>
                Loading categories...
              </td>
            </tr>
          ) : categories.length === 0 ? (
            <tr>
              <td colSpan={6} className={tableEmptyClass}>
                No categories found.
              </td>
            </tr>
          ) : (
            paginatedCategories.map((category) => (
              <tr key={category._id} className={tableRowClass}>
                <td className={tdPrimaryClass}>
                  <p>{category.navLabel}</p>
                  <p className="mt-0.5 text-xs text-slate-500 md:hidden">{category.slug}</p>
                </td>
                <td className={tdHideSm}>{category.showInBrowseSection ? 'Yes' : 'No'}</td>
                <td className={`${tdHideMd} text-slate-600`}>{category.slug}</td>
                <td className={`${tdHideSm} text-slate-600`}>{category.subCategories?.length || 0}</td>
                <td className={tdClass}>
                  <StatusBadge active={category.isActive} />
                </td>
                <td className={tdRightClass}>
                  <div className={actionGroupClass}>
                    <Link to={`/categories/${category._id}/edit`} className={actionEditClass}>
                      Edit
                    </Link>
                    <button type="button" onClick={() => handleDelete(category)} className={actionDeleteClass}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>

      {!loading && categories.length > 0 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={categories.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
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
