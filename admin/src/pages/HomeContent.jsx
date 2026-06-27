import { useEffect, useState } from 'react'
import { fetchCategories, fetchSiteContent, updateSiteContent } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import HeroSlidePreview from '../components/HeroSlidePreview'
import {
  DEFAULT_CTA_POSITION,
  DEFAULT_HEADLINE_POSITION,
} from '../constants/heroTypography'
import MediaUpload from '../components/MediaUpload'
import PageLoader from '../components/ui/PageLoader'
import {
  inputClass,
  primaryBtnClass,
  sectionClass,
} from '../components/ui/adminUi'
import { BRAND } from '../config/brand'
import { DEFAULT_IMAGE_FOCUS, HERO_BANNER_UPLOAD_GUIDE } from '../constants/heroBanner'
import {
  DEFAULT_CTA_FONT,
  DEFAULT_CTA_SCALE,
  DEFAULT_HEADLINE_FONT,
  DEFAULT_HEADLINE_FONT_SIZE,
  HERO_FONT_OPTIONS,
} from '../constants/heroTypography'

const emptyTickerItem = () => ''

const emptyHeroSlide = () => ({
  badge: '',
  headline: '',
  cta: '',
  link: '',
  image: '',
  headlinePosition: { ...DEFAULT_HEADLINE_POSITION },
  ctaPosition: { ...DEFAULT_CTA_POSITION },
  imageFocus: { ...DEFAULT_IMAGE_FOCUS },
  headlineFontSize: DEFAULT_HEADLINE_FONT_SIZE,
  headlineFontFamily: DEFAULT_HEADLINE_FONT,
  ctaScale: DEFAULT_CTA_SCALE,
  ctaFontFamily: DEFAULT_CTA_FONT,
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
  const [deletingSlideIndex, setDeletingSlideIndex] = useState(null)
  const [savingTicker, setSavingTicker] = useState(false)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
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

  const updateHeroSlidePosition = (index, field, position) => {
    setHeroSlides((current) =>
      current.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, [field]: position } : slide,
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
    setHeroSlides((current) => {
      const next = [...current, emptyHeroSlide()]
      setActiveSlideIndex(next.length - 1)
      return next
    })
  }

  const handleDeleteHeroSlide = async (index) => {
    if (heroSlides.length === 1) {
      setError('At least one hero slide is required.')
      return
    }

    if (!window.confirm('Are you sure you want to delete?')) return

    const nextSlides = heroSlides.filter((_, slideIndex) => slideIndex !== index)

    setDeletingSlideIndex(index)
    setError('')
    setSuccess('')

    try {
      await updateSiteContent({ heroSlides: nextSlides })
      setHeroSlides(nextSlides)
      setActiveSlideIndex((current) => {
        if (index < current) return current - 1
        if (index === current) return Math.max(0, current - 1)
        return current
      })
      setSuccess(`Slide ${index + 1} deleted successfully.`)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingSlideIndex(null)
    }
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
    return <PageLoader label="Loading homepage content..." />
  }

  const safeSlideIndex = Math.min(activeSlideIndex, Math.max(0, heroSlides.length - 1))
  const slide = heroSlides[safeSlideIndex]
  const slideNumber = safeSlideIndex + 1

  return (
    <div className="space-y-4">
      <section className={`${sectionClass} space-y-4`}>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Home banner</h2>
          <p className="mt-1 text-sm text-slate-500">
            Large hero carousel at the top of the {BRAND.websiteLabel} homepage. Add one or more slides.
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{HERO_BANNER_UPLOAD_GUIDE}</p>
        </div>

        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 shadow-sm">
          <label className="block min-w-[200px] flex-1 text-sm">
            <span className="font-semibold text-indigo-950">Select slide</span>
            <select
              value={safeSlideIndex}
              onChange={(e) => setActiveSlideIndex(Number(e.target.value))}
              className={`${inputClass} mt-1`}
            >
              {heroSlides.map((heroSlide, index) => (
                <option key={index} value={index}>
                  Slide {index + 1}
                  {heroSlide.headline?.trim()
                    ? ` — ${heroSlide.headline.trim().slice(0, 40)}`
                    : ''}
                  {heroSlide.isActive === false ? ' (hidden)' : ''}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={addHeroSlide}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Add slide
          </button>

          <button
            type="button"
            onClick={() => handleDeleteHeroSlide(safeSlideIndex)}
            disabled={deletingSlideIndex === safeSlideIndex || heroSlides.length === 1}
            className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletingSlideIndex === safeSlideIndex ? 'Deleting...' : 'Delete slide'}
          </button>
        </div>

        {slide ? (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium text-slate-700">Headline</span>
                <input
                  value={slide.headline}
                  onChange={(e) => updateHeroSlide(safeSlideIndex, 'headline', e.target.value)}
                  className={inputClass}
                  placeholder="Nature Footage in True 4K"
                />
              </label>

              <label className="block text-sm">
                <span className="font-medium text-slate-700">Headline font</span>
                <select
                  value={slide.headlineFontFamily || DEFAULT_HEADLINE_FONT}
                  onChange={(e) =>
                    updateHeroSlide(safeSlideIndex, 'headlineFontFamily', e.target.value)
                  }
                  className={inputClass}
                >
                  {HERO_FONT_OPTIONS.map((font) => (
                    <option key={font.id} value={font.id}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="font-medium text-slate-700">
                  Headline size ({slide.headlineFontSize || DEFAULT_HEADLINE_FONT_SIZE}px)
                </span>
                <input
                  type="range"
                  min={20}
                  max={96}
                  step={2}
                  value={slide.headlineFontSize || DEFAULT_HEADLINE_FONT_SIZE}
                  onChange={(e) =>
                    updateHeroSlide(safeSlideIndex, 'headlineFontSize', Number(e.target.value))
                  }
                  className="mt-2 w-full accent-slate-900"
                />
              </label>

              <label className="block text-sm sm:col-span-2">
                <span className="font-medium text-slate-700">Button text</span>
                <input
                  value={slide.cta}
                  onChange={(e) => updateHeroSlide(safeSlideIndex, 'cta', e.target.value)}
                  className={inputClass}
                  placeholder="Browse"
                />
                <span className="mt-1 block text-[11px] text-slate-500">
                  Leave empty to hide the button. The banner image still links to the selected category.
                </span>
              </label>

              <label className="block text-sm">
                <span className="font-medium text-slate-700">Button font</span>
                <select
                  value={slide.ctaFontFamily || DEFAULT_CTA_FONT}
                  onChange={(e) =>
                    updateHeroSlide(safeSlideIndex, 'ctaFontFamily', e.target.value)
                  }
                  className={inputClass}
                >
                  {HERO_FONT_OPTIONS.map((font) => (
                    <option key={font.id} value={font.id}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm">
                <span className="font-medium text-slate-700">
                  Button size ({Math.round((slide.ctaScale || DEFAULT_CTA_SCALE) * 100)}%)
                </span>
                <input
                  type="range"
                  min={0.6}
                  max={1.8}
                  step={0.05}
                  value={slide.ctaScale || DEFAULT_CTA_SCALE}
                  onChange={(e) =>
                    updateHeroSlide(safeSlideIndex, 'ctaScale', Number(e.target.value))
                  }
                  className="mt-2 w-full accent-slate-900"
                />
              </label>

              <label className="block text-sm sm:col-span-2">
                <span className="font-medium text-slate-700">Category</span>
                <select
                  value={categorySlugFromLink(slide.link)}
                  onChange={(e) => updateHeroCategory(safeSlideIndex, e.target.value)}
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
                  onChange={(e) => updateHeroSlide(safeSlideIndex, 'isActive', e.target.checked)}
                />
                Show this slide on homepage
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={slide.showShadow === true}
                  onChange={(e) => updateHeroSlide(safeSlideIndex, 'showShadow', e.target.checked)}
                />
                Show black shadow on banner image
              </label>
            </div>

            <MediaUpload
              label="Banner image"
              accept="image/*"
              uploadType="hero-slide"
              value={slide.image}
              onChange={(url) => {
                updateHeroSlide(safeSlideIndex, 'image', url)
                updateHeroSlide(safeSlideIndex, 'imageFocus', { ...DEFAULT_IMAGE_FOCUS })
              }}
              placeholder="Upload or paste image URL"
            />

            <HeroSlidePreview
              slide={slide}
              onImageFocusChange={(imageFocus) =>
                updateHeroSlide(safeSlideIndex, 'imageFocus', imageFocus)
              }
              onPositionChange={(field, position) =>
                updateHeroSlidePosition(safeSlideIndex, field, position)
              }
            />

            <button
              type="button"
              onClick={() => handleSaveSlide(safeSlideIndex)}
              disabled={savingSlideIndex === safeSlideIndex}
              className={`${primaryBtnClass} disabled:opacity-60`}
            >
              {savingSlideIndex === safeSlideIndex ? 'Saving...' : `Save slide ${slideNumber}`}
            </button>
          </div>
        ) : null}
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
