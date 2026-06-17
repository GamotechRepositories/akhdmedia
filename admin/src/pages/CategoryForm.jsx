import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminAlertModal from '../components/AdminAlertModal'
import {
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
  sectionClass,
} from '../components/ui/adminUi'
import {
  createCategory,
  fetchCategory,
  updateCategory,
} from '../api/client'
import MediaUpload from '../components/MediaUpload'

const emptySubCategory = () => ({ slug: '', name: '' })

const CategoryForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    slug: '',
    label: '',
    breadcrumb: '',
    navLabel: '',
    description: '',
    coverImage: '',
    sortOrder: 0,
    isActive: true,
    subCategories: [emptySubCategory()],
  })
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return

    const loadCategory = async () => {
      try {
        const response = await fetchCategory(id)
        const category = response.data
        setForm({
          slug: category.slug,
          label: category.label,
          breadcrumb: category.breadcrumb,
          navLabel: category.navLabel,
          description: category.description || '',
          coverImage: category.coverImage || '',
          sortOrder: category.sortOrder || 0,
          isActive: category.isActive,
          subCategories: category.subCategories?.length
            ? category.subCategories
            : [emptySubCategory()],
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadCategory()
  }, [id, isEdit])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updateSubCategory = (index, field, value) => {
    setForm((current) => ({
      ...current,
      subCategories: current.subCategories.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const addSubCategory = () => {
    setForm((current) => ({
      ...current,
      subCategories: [...current.subCategories, emptySubCategory()],
    }))
  }

  const removeSubCategory = (index) => {
    setForm((current) => ({
      ...current,
      subCategories: current.subCategories.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      ...form,
      subCategories: form.subCategories.filter((item) => item.name.trim()),
    }

    try {
      if (isEdit) {
        await updateCategory(id, payload)
      } else {
        await createCategory(payload)
      }
      navigate('/categories')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-slate-500">Loading category...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link to="/categories" className={secondaryBtnClass}>
          Back to categories
        </Link>
      </div>

      <form onSubmit={handleSubmit} className={`${sectionClass} space-y-4`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Nav Label</span>
            <input
              required
              value={form.navLabel}
              onChange={(e) => updateField('navLabel', e.target.value)}
              className={inputClass}
              placeholder="Urban"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Slug</span>
            <input
              value={form.slug}
              onChange={(e) => updateField('slug', e.target.value)}
              className={inputClass}
              placeholder="urban"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Page Title</span>
            <input
              required
              value={form.label}
              onChange={(e) => updateField('label', e.target.value)}
              className={inputClass}
              placeholder="Urban & Cityscape"
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-slate-700">Sort Order</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => updateField('sortOrder', Number(e.target.value))}
              className={inputClass}
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => updateField('isActive', e.target.checked)}
            />
            Show in storefront navbar
          </label>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <h3 className="font-semibold text-slate-900">Homepage browse section</h3>
          <p className="mt-1 text-sm text-slate-500">
            Breadcrumb is the card name on the homepage. Cover image is required for the category
            to appear in &quot;Browse by Footage Type&quot;.
          </p>

          <div className="mt-4 grid gap-4">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Homepage card name</span>
              <input
                required
                value={form.breadcrumb}
                onChange={(e) => updateField('breadcrumb', e.target.value)}
                className={inputClass}
                placeholder="Nature"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Short description</span>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                className={`${inputClass} min-h-[88px]`}
                placeholder="Optional description for category pages"
              />
            </label>

            <MediaUpload
              label="Cover image"
              accept="image/*"
              uploadType="category-cover"
              categorySlug={form.slug || form.navLabel}
              value={form.coverImage}
              onChange={(url) => updateField('coverImage', url)}
              placeholder="Upload or paste image URL"
              disabled={!form.slug && !form.navLabel}
            />
            {!form.slug && !form.navLabel ? (
              <p className="text-xs text-amber-700">
                Enter nav label or slug before uploading a cover image.
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Subcategories</h3>
            <button
              type="button"
              onClick={addSubCategory}
              className="text-sm font-semibold text-slate-900 hover:underline"
            >
              Add subcategory
            </button>
          </div>

          <div className="space-y-3">
            {form.subCategories.map((subCategory, index) => (
              <div key={index} className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  value={subCategory.name}
                  onChange={(e) => updateSubCategory(index, 'name', e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="City Timelapse"
                />
                <input
                  value={subCategory.slug}
                  onChange={(e) => updateSubCategory(index, 'slug', e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="city-timelapse"
                />
                <button
                  type="button"
                  onClick={() => removeSubCategory(index)}
                  className="text-sm font-semibold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className={`${primaryBtnClass} disabled:opacity-60`}
          >
            {saving ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
          </button>
          <Link
            to="/categories"
            className={secondaryBtnClass}
          >
            Cancel
          </Link>
        </div>
      </form>

      <AdminAlertModal
        open={Boolean(error)}
        title="Could not save category"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default CategoryForm
