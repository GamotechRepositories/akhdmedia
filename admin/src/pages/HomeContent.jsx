import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchSiteContent, updateSiteContent } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import {
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
  sectionClass,
} from '../components/ui/adminUi'

const emptyTickerItem = () => ''

const HomeContent = () => {
  const [tickerItems, setTickerItems] = useState([emptyTickerItem()])
  const [browseSection, setBrowseSection] = useState({
    eyebrow: '',
    title: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchSiteContent()
        setTickerItems(
          response.data.tickerItems?.length ? response.data.tickerItems : [emptyTickerItem()],
        )
        setBrowseSection(response.data.browseSection || { eyebrow: '', title: '' })
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadContent()
  }, [])

  const updateTickerItem = (index, value) => {
    setTickerItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? value : item)),
    )
  }

  const addTickerItem = () => {
    setTickerItems((current) => [...current, emptyTickerItem()])
  }

  const removeTickerItem = (index) => {
    setTickerItems((current) =>
      current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index),
    )
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateSiteContent({
        tickerItems,
        browseSection,
      })
      setSuccess('Homepage content updated successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-slate-500">Loading homepage content...</p>
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <section className={`${sectionClass} space-y-4`}>
          <div>
            <h2 className="text-lg font-bold text-slate-900">News ticker</h2>
            <p className="mt-1 text-sm text-slate-500">
              Scrolling messages shown below the hero banner on the storefront homepage.
            </p>
          </div>

          <div className="space-y-3">
            {tickerItems.map((item, index) => (
              <div key={index} className="flex gap-3">
                <input
                  value={item}
                  onChange={(e) => updateTickerItem(index, e.target.value)}
                  className={inputClass}
                  placeholder="4K UHD & 2K DELIVERABLES ON EVERY CLIP"
                  required={index === 0}
                />
                <button
                  type="button"
                  onClick={() => removeTickerItem(index)}
                  className="shrink-0 text-sm font-semibold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addTickerItem}
            className="text-sm font-semibold text-slate-900 hover:underline"
          >
            Add ticker message
          </button>
        </section>

        <section className={`${sectionClass} space-y-4`}>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Browse by Footage Type</h2>
            <p className="mt-1 text-sm text-slate-500">
              Section heading text on the homepage. Category names and photos are managed in{' '}
              <Link to="/categories" className="font-semibold text-slate-900 hover:underline">
                Categories
              </Link>
              .
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Eyebrow text</span>
              <input
                required
                value={browseSection.eyebrow}
                onChange={(e) =>
                  setBrowseSection((current) => ({ ...current, eyebrow: e.target.value }))
                }
                className={inputClass}
                placeholder="Shot for post-production"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Section title</span>
              <input
                required
                value={browseSection.title}
                onChange={(e) =>
                  setBrowseSection((current) => ({ ...current, title: e.target.value }))
                }
                className={inputClass}
                placeholder="Browse by Footage Type"
              />
            </label>
          </div>
        </section>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className={`${primaryBtnClass} disabled:opacity-60`}>
            {saving ? 'Saving...' : 'Save homepage content'}
          </button>
          <Link to="/categories" className={secondaryBtnClass}>
            Manage category photos
          </Link>
        </div>
      </form>

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      <AdminAlertModal
        open={Boolean(error)}
        title="Could not save homepage content"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default HomeContent
