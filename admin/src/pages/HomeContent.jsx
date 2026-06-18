import { useEffect, useState } from 'react'
import { fetchCategories, fetchSiteContent, updateSiteContent } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import MediaUpload from '../components/MediaUpload'
import {
  inputClass,
  primaryBtnClass,
  sectionClass,
} from '../components/ui/adminUi'
import { BRAND } from '../config/brand'

const emptyTickerItem = () => ''

const emptyHeroSlide = () => ({
  badge: '',
  headline: '',
  cta: '',
  link: '',
  image: '',
  isActive: true,
  showShadow: false,
})

const categorySlugFromLink = (link = '') => {
  const match = String(link).match(/^\/videos\/([^/]+)/)
  return match ? match[1] : ''
}

const categoryLinkFromSlug = (slug = '') => (slug ? `/videos/${slug}` : '')

const HomeContent = () => {
  const [tickerItems, setTickerItems] = useState([emptyTickerItem()])
  const [heroSlides, setHeroSlides] = useState([emptyHeroSlide()])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingSlideIndex, setSavingSlideIndex] = useState(null)
  const [savingTicker, setSavingTicker] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true)
      setError('')
      try {
        const [contentResponse, categoriesResponse] = await Promise.all([
          fetchSiteContent(),
          fetchCategories(),
        ])
        const response = contentResponse
        setCategories(categoriesResponse.data || [])
        setTickerItems(
          response.data.tickerItems?.length ? response.data.tickerItems : [emptyTickerItem()],
        )
        setHeroSlides(
          response.data.heroSlides?.length ? response.data.heroSlides : [emptyHeroSlide()],
        )
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

  const updateHeroSlide = (index, field, value) => {
    setHeroSlides((current) =>
      current.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, [field]: value } : slide,
      ),
    )
  }

  const updateHeroCategory = (index, slug) => {
    setHeroSlides((current) =>
      current.map((slide, slideIndex) =>
        slideIndex === index
          ? {
              ...slide,
              link: categoryLinkFromSlug(slug),
            }
          : slide,
      ),
    )
  }

  const addHeroSlide = () => {
    setHeroSlides((current) => [...current, emptyHeroSlide()])
  }

  const removeHeroSlide = (index) => {
    setHeroSlides((current) =>
      current.length === 1 ? current : current.filter((_, slideIndex) => slideIndex !== index),
    )
  }

  const handleSaveSlide = async (index) => {
    const slide = heroSlides[index]
    if (!slide) return

    setSavingSlideIndex(index)
    setError('')
    setSuccess('')

    if (!slide.image.trim()) {
      setError(`Slide ${index + 1} needs a banner image.`)
      setSavingSlideIndex(null)
      return
    }

    if (slide.cta.trim() && !categorySlugFromLink(slide.link)) {
      setError(`Slide ${index + 1} needs a category when button text is set.`)
      setSavingSlideIndex(null)
      return
    }

    try {
      await updateSiteContent({ heroSlides })
      setSuccess(`Slide ${index + 1} saved successfully.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingSlideIndex(null)
    }
  }

  const handleSaveTicker = async (event) => {
    event.preventDefault()
    setSavingTicker(true)
    setError('')
    setSuccess('')

    const cleanedTickerItems = tickerItems.map((item) => item.trim()).filter(Boolean)

    if (!cleanedTickerItems.length) {
      setError('Add at least one ticker message.')
      setSavingTicker(false)
      return
    }

    try {
      await updateSiteContent({ tickerItems: cleanedTickerItems })
      setTickerItems(cleanedTickerItems)
      setSuccess('News ticker saved successfully.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingTicker(false)
    }
  }

  if (loading) {
    return <p className="text-slate-500">Loading homepage content...</p>
  }

  return (
    <div className="space-y-4">
      <section className={`${sectionClass} space-y-4`}>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Home banner</h2>
          <p className="mt-1 text-sm text-slate-500">
            Large hero carousel at the top of the {BRAND.websiteLabel} homepage. Add one or more slides.
          </p>
        </div>

        <div className="space-y-4">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">Slide {index + 1}</p>
                  <button
                    type="button"
                    onClick={() => removeHeroSlide(index)}
                    className="text-sm font-semibold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm sm:col-span-2">
                    <span className="font-medium text-slate-700">Button text</span>
                    <input
                      value={slide.cta}
                      onChange={(e) => updateHeroSlide(index, 'cta', e.target.value)}
                      className={inputClass}
                      placeholder="Browse"
                    />
                    <span className="mt-1 block text-[11px] text-slate-500">
                      Leave empty to hide the button. The banner image still links to the selected category.
                    </span>
                  </label>

                  <label className="block text-sm sm:col-span-2">
                    <span className="font-medium text-slate-700">Headline</span>
                    <input
                      value={slide.headline}
                      onChange={(e) => updateHeroSlide(index, 'headline', e.target.value)}
                      className={inputClass}
                      placeholder="Nature Footage in True 4K"
                    />
                  </label>

                  <label className="block text-sm sm:col-span-2">
                    <span className="font-medium text-slate-700">Category</span>
                    <select
                      value={categorySlugFromLink(slide.link)}
                      onChange={(e) => updateHeroCategory(index, e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category.slug}>
                          {category.navLabel}
                        </option>
                      ))}
                    </select>
                    <span className="mt-1 block text-[11px] text-slate-500">
                      Optional. Makes the banner clickable on the {BRAND.websiteLabel}.
                    </span>
                  </label>

                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={slide.isActive !== false}
                      onChange={(e) => updateHeroSlide(index, 'isActive', e.target.checked)}
                    />
                    Show this slide on homepage
                  </label>

                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={slide.showShadow === true}
                      onChange={(e) => updateHeroSlide(index, 'showShadow', e.target.checked)}
                    />
                    Show black shadow on banner image
                  </label>
                </div>

                <MediaUpload
                  label="Banner image"
                  accept="image/*"
                  uploadType="hero-slide"
                  value={slide.image}
                  onChange={(url) => updateHeroSlide(index, 'image', url)}
                  placeholder="Upload or paste image URL"
                />

                <button
                  type="button"
                  onClick={() => handleSaveSlide(index)}
                  disabled={savingSlideIndex === index}
                  className={`${primaryBtnClass} disabled:opacity-60`}
                >
                  {savingSlideIndex === index ? 'Saving...' : `Save slide ${index + 1}`}
                </button>
              </div>
            ))}
        </div>

        <button
          type="button"
          onClick={addHeroSlide}
          className="text-sm font-semibold text-slate-900 hover:underline"
        >
          Add hero slide
        </button>
      </section>

      <section className={`${sectionClass} space-y-4`}>
        <form onSubmit={handleSaveTicker} className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">News ticker</h2>
            <p className="mt-1 text-sm text-slate-500">
              Scrolling messages shown below the hero banner on the {BRAND.websiteLabel} homepage.
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

          <div className="flex flex-col items-start gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={addTickerItem}
              className="text-sm font-semibold text-slate-900 hover:underline"
            >
              Add ticker message
            </button>

            <button
              type="submit"
              disabled={savingTicker}
              className={`${primaryBtnClass} disabled:opacity-60`}
            >
              {savingTicker ? 'Saving...' : 'Save news ticker'}
            </button>
          </div>
        </form>
      </section>

      {success ? (
        <AdminAlertModal
          open={Boolean(success)}
          variant="success"
          title="Saved successfully"
          message={success}
          onClose={() => setSuccess('')}
        />
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
