import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createActor, fetchActor, updateActor } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import FormStep from '../components/FormStep'
import MediaUpload from '../components/MediaUpload'
import {
  compactFormClass,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
} from '../components/ui/adminUi'

const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const keywordsToInput = (keywords = []) => keywords.join(', ')

const ActorForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const slugManuallyEdited = useRef(isEdit)

  const [form, setForm] = useState({
    name: '',
    slug: '',
    searchKeywords: '',
    image: '',
    isActive: true,
  })
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (!showSuccess) return undefined
    const timer = window.setTimeout(() => setShowSuccess(false), 4000)
    return () => window.clearTimeout(timer)
  }, [showSuccess])

  useEffect(() => {
    if (!isEdit) return

    const loadActor = async () => {
      try {
        const response = await fetchActor(id)
        const actor = response.data
        setForm({
          name: actor.name || '',
          slug: actor.slug || '',
          searchKeywords: keywordsToInput(actor.searchKeywords),
          image: actor.image || '',
          isActive: actor.isActive ?? true,
        })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadActor()
  }, [id, isEdit])

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleNameChange = (value) => {
    setForm((current) => ({
      ...current,
      name: value,
      slug: slugManuallyEdited.current ? current.slug : slugify(value),
    }))
  }

  const handleSlugChange = (value) => {
    slugManuallyEdited.current = true
    updateField('slug', slugify(value))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      setError('Actor name is required')
      return
    }

    if (!form.slug.trim()) {
      setError('Actor slug is required for image upload path')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      searchKeywords: form.searchKeywords,
      image: form.image.trim(),
      isActive: form.isActive,
    }

    try {
      if (isEdit) {
        await updateActor(id, payload)
      } else {
        await createActor(payload)
      }
      setShowSuccess(true)
      navigate('/actors')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading actor...</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <AdminAlertModal
        open={Boolean(error)}
        title="Could not save actor"
        message={error}
        onClose={() => setError('')}
      />

      <AdminAlertModal
        open={showSuccess}
        title="Actor saved"
        message={isEdit ? 'Actor updated successfully.' : 'Actor created successfully.'}
        variant="success"
        onClose={() => setShowSuccess(false)}
      />

      <div className="flex justify-end gap-3">
        <Link to="/actors" className={secondaryBtnClass}>
          Cancel
        </Link>
        <button type="submit" disabled={saving} className={primaryBtnClass}>
          {saving ? 'Saving...' : isEdit ? 'Update Actor' : 'Create Actor'}
        </button>
      </div>

      <div className={compactFormClass}>
        <FormStep step="1" title="Actor details" hint="Name and search keywords for discovery" tone="sky">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Actor name</span>
              <input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={inputClass}
                placeholder="e.g. John Doe"
                required
              />
            </label>

            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Slug</span>
              <input
                value={form.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                className={inputClass}
                placeholder="auto-generated-from-name"
              />
              <p className="mt-1 text-xs text-slate-500">Used for image storage path. Set before uploading image.</p>
            </label>

            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Search keywords</span>
              <textarea
                rows={3}
                value={form.searchKeywords}
                onChange={(e) => updateField('searchKeywords', e.target.value)}
                className={inputClass}
                placeholder="bollywood, action star, mumbai (comma separated)"
              />
              <p className="mt-1 text-xs text-slate-500">Comma-separated keywords used when customers search actors.</p>
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
              />
              Active
            </label>
          </div>
        </FormStep>

        <FormStep step="2" title="Actor image" hint="Profile photo shown in actor listings" tone="violet">
          <MediaUpload
            label="Actor image"
            accept="image/*"
            uploadType="actor-image"
            value={form.image}
            onChange={(value) => updateField('image', value)}
            actorSlug={slugify(form.slug || form.name)}
            placeholder="Upload image or paste URL"
          />
          {!form.slug.trim() && (
            <p className="mt-2 text-xs text-amber-700">Enter actor name/slug before uploading an image.</p>
          )}
        </FormStep>
      </div>
    </form>
  )
}

export default ActorForm
