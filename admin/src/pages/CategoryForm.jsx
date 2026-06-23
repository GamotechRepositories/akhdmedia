import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminAlertModal from '../components/AdminAlertModal'
import FormStickyActions from '../components/FormStickyActions'
import FormStep from '../components/FormStep'
import PageLoader from '../components/ui/PageLoader'
import {
  compactFormClass,
  inputClass,
  secondaryBtnClass,
} from '../components/ui/adminUi'
import {
  createCategory,
  fetchCategory,
  updateCategory,
} from '../api/client'
import { BRAND } from '../config/brand'
import MediaUpload from '../components/MediaUpload'

const emptySubCategory = () => ({ slug: '', name: '' })

const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const CategoryForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({
    slug: '',
    label: '',
    navLabel: '',
    coverImage: '',
    showInBrowseSection: false,
    sortOrder: 0,
    isActive: true,
    subCategories: [emptySubCategory()],
  })
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const slugManuallyEdited = useRef(isEdit)
  const subSlugManuallyEdited = useRef(new Set())

  useEffect(() => {
    if (!isEdit) return

    const loadCategory = async () => {
      try {
        const response = await fetchCategory(id)
        const category = response.data
        setForm({
          slug: category.slug,
          label: category.label,
          navLabel: category.navLabel,
          coverImage: category.coverImage || '',
          showInBrowseSection: Boolean(category.showInBrowseSection),
          sortOrder: category.sortOrder || 0,
          isActive: category.isActive,
          subCategories: category.subCategories?.length
            ? category.subCategories
            : [emptySubCategory()],
        })
        subSlugManuallyEdited.current = new Set(
          (category.subCategories || [])
            .map((subCategory, index) =>
              subCategory.slug && subCategory.slug !== slugify(subCategory.name) ? index : null,
            )
            .filter((index) => index !== null),
        )
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

  const handleNavLabelChange = (value) => {
    setForm((current) => ({
      ...current,
      navLabel: value,
      slug: slugManuallyEdited.current ? current.slug : slugify(value),
    }))
  }

  const handleSlugChange = (value) => {
    slugManuallyEdited.current = true
    updateField('slug', value)
  }

  const updateSubCategory = (index, field, value) => {
    setForm((current) => ({
      ...current,
      subCategories: current.subCategories.map((item, itemIndex) => {
        if (itemIndex !== index) return item

        if (field === 'name') {
          return {
            ...item,
            name: value,
            slug: subSlugManuallyEdited.current.has(index) ? item.slug : slugify(value),
          }
        }

        if (field === 'slug') {
          if (value.trim()) {
            subSlugManuallyEdited.current.add(index)
          } else {
            subSlugManuallyEdited.current.delete(index)
          }
          return {
            ...item,
            slug: slugify(value),
          }
        }

        return { ...item, [field]: value }
      }),
    }))
  }

  const addSubCategory = () => {
    setForm((current) => ({
      ...current,
      subCategories: [...current.subCategories, emptySubCategory()],
    }))
  }

  const removeSubCategory = (index) => {
    subSlugManuallyEdited.current.delete(index)
    const nextManual = new Set()
    subSlugManuallyEdited.current.forEach((itemIndex) => {
      if (itemIndex < index) nextManual.add(itemIndex)
      if (itemIndex > index) nextManual.add(itemIndex - 1)
    })
    subSlugManuallyEdited.current = nextManual

    setForm((current) => ({
      ...current,
      subCategories: current.subCategories.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    if (form.showInBrowseSection && !form.coverImage.trim()) {
      setError('Cover image is required when showing in Browse by Editorial Footage Type.')
      setSaving(false)
      return
    }

    const payload = {
      ...form,
      breadcrumb: form.navLabel.trim() || form.label.trim(),
      description: '',
      subCategories: form.subCategories
        .filter((item) => item.name.trim())
        .map((item) => ({
          name: item.name.trim(),
          slug: slugify(item.slug || item.name),
        })),
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
    return <PageLoader label="Loading category..." />
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Categories</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? 'Edit Category' : 'Add Category'}
          </h1>
        </div>
        <Link to="/categories" className={secondaryBtnClass}>
          Back
        </Link>
      </div>

      <AdminAlertModal
        open={Boolean(error)}
        title="Could not save category"
        message={error}
        onClose={() => setError('')}
      />

      <form onSubmit={handleSubmit} className={compactFormClass}>
        <FormStep
          step="1"
          title="Category details"
          hint="Navbar label, URL slug, and page titles."
          tone="slate"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Nav Label</span>
              <input
                required
                value={form.navLabel}
                onChange={(e) => handleNavLabelChange(e.target.value)}
                className={inputClass}
                placeholder="Urban"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Slug</span>
              <input
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
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
                type="text"
                inputMode="numeric"
                value={form.sortOrder}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  updateField('sortOrder', digits === '' ? 0 : Number(digits));
                }}
                className={inputClass}
                placeholder="e.g. 1"
              />
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
              />
              Show in {BRAND.name} navbar
            </label>
          </div>
        </FormStep>

        <FormStep
          step="2"
          title="Subcategories"
          hint={`Optional filters inside this category on the ${BRAND.websiteLabel}.`}
          tone="emerald"
        >
          <div className="mb-3 flex justify-end">
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
              <div
                key={index}
                className="grid gap-3 rounded-lg border border-emerald-200/80 bg-white/80 p-4 sm:grid-cols-[1fr_auto] sm:items-start"
              >
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Subcategory name</span>
                  <input
                    value={subCategory.name}
                    onChange={(e) => updateSubCategory(index, 'name', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. City Timelapse"
                  />
                  {subCategory.name.trim() ? (
                    <p className="mt-1 text-xs text-slate-500">
                      URL slug: {slugify(subCategory.slug || subCategory.name)}
                    </p>
                  ) : null}
                </label>
                <button
                  type="button"
                  onClick={() => removeSubCategory(index)}
                  className="text-sm font-semibold text-red-600 hover:underline sm:mt-7"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </FormStep>

        <FormStep
          step="3"
          title="Cover image"
          hint="Used for hero slides and homepage cards when enabled below."
          tone="violet"
        >
          <MediaUpload
            label="Category cover image"
            accept="image/*"
            uploadType="category-cover"
            categorySlug={slugify(form.slug || form.navLabel)}
            value={form.coverImage}
            onChange={(url) => updateField('coverImage', url)}
            placeholder="Upload or paste image URL"
            disabled={!form.slug && !form.navLabel}
          />
          {!form.slug && !form.navLabel ? (
            <p className="mt-2 text-xs text-amber-700">
              Enter nav label or slug in Step 1 before uploading a cover image.
            </p>
          ) : null}
        </FormStep>

        <FormStep
          step="4"
          title="Homepage browse section"
          hint={`Decide if this category appears on the ${BRAND.websiteLabel} homepage.`}
          tone="amber"
        >
          <label className="flex items-start gap-3 rounded-lg border border-amber-200 bg-white/80 p-4 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={form.showInBrowseSection}
              onChange={(e) => updateField('showInBrowseSection', e.target.checked)}
            />
            <span>
              <span className="block font-semibold text-slate-900">
                Show in Browse by Editorial Footage Type?
              </span>
              <span className="mt-1 block text-slate-500">
                If yes, this category card will appear on the homepage using the nav label from
                Step 1 and the cover image from Step 3.
              </span>
            </span>
          </label>

          {form.showInBrowseSection && !form.coverImage.trim() ? (
            <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Upload a cover image in Step 3 to show this category on the homepage.
            </p>
          ) : null}
        </FormStep>

        <FormStickyActions
          cancelTo="/categories"
          saving={saving}
          submitLabel={isEdit ? 'Update Category' : 'Create Category'}
        />
      </form>
    </div>
  )
}

export default CategoryForm
