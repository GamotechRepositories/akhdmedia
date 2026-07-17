import { useEffect, useState } from 'react'
import { fetchCategories, fetchSiteContent, updateSiteContent } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import HeroSlidePreview from '../components/HeroSlidePreview'
import MediaUpload from '../components/MediaUpload'
import PageLoader from '../components/ui/PageLoader'
import {
  inputClass,
  primaryBtnClass,
  sectionClass,
} from '../components/ui/adminUi'
import { BRAND } from '../config/brand'
import { DEFAULT_IMAGE_FOCUS } from '../constants/heroBanner'
import {
  DEFAULT_CTA_FONT,
  DEFAULT_CTA_POSITION,
  DEFAULT_CTA_SCALE,
  DEFAULT_HEADLINE_FONT,
  DEFAULT_HEADLINE_FONT_SIZE,
  DEFAULT_HEADLINE_POSITION,
  HERO_EDIT_DEVICES,
  HERO_FONT_OPTIONS,
  applyDeviceStylePatch,
  resolveDeviceStyle,
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
  deviceStyles: {},
  isActive: true,
  showShadow: false,
})

const categorySlugFromLink = (link = '') => {
  const match = String(link).match(/^\/videos\/([^/]+)/)
  return match ? match[1] : ''
}

const categoryLinkFromSlug = (slug = '') => (slug ? `/videos/${slug}` : '')

const StepBadge = ({ n }) => (
  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
    {n}
  </span>
)

const HomeContent = () => {
  const [tickerItems, setTickerItems] = useState([emptyTickerItem()])
  const [heroSlides, setHeroSlides] = useState([emptyHeroSlide()])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingSlideIndex, setSavingSlideIndex] = useState(null)
  const [deletingSlideIndex, setDeletingSlideIndex] = useState(null)
  const [savingTicker, setSavingTicker] = useState(false)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [editDevice, setEditDevice] = useState('desktop')
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

  const updateHeroSlideForDevice = (index, device, patch) => {
    setHeroSlides((current) =>
      current.map((slide, slideIndex) =>
        slideIndex === index ? applyDeviceStylePatch(slide, device, patch) : slide,
      ),
    )
  }

  const updateHeroSlidePosition = (index, field, position) => {
    updateHeroSlideForDevice(index, editDevice, { [field]: position })
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
  const deviceStyle = slide ? resolveDeviceStyle(slide, editDevice) : null
  const editDeviceLabel =
    HERO_EDIT_DEVICES.find((item) => item.id === editDevice)?.label || 'Desktop'
  const deviceHint = {
    desktop: 'Computer / laptop homepage look',
    tablet: 'iPad homepage look',
    mobile: 'Phone homepage look',
  }

  return (
    <div className="space-y-4">
      <section className={`${sectionClass} space-y-4`}>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Home banner</h2>
          <p className="mt-1 text-sm text-slate-600">
            Large banner at the top of the {BRAND.websiteLabel} homepage. Follow the steps below —
            style Desktop, iPad, and Mobile separately.
          </p>
        </div>

        {slide && deviceStyle ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Step 1 — choose slide */}
            <div className="border-b border-indigo-100 bg-indigo-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <StepBadge n={1} />
                <div>
                  <p className="text-sm font-bold text-indigo-950">Choose which slide to edit</p>
                  <p className="text-[11px] text-indigo-800/80">
                    You can have more than one slide in the banner
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <label className="block min-w-[200px] flex-1 text-sm">
                  <span className="font-medium text-indigo-950">Current slide</span>
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
                  + New slide
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteHeroSlide(safeSlideIndex)}
                  disabled={deletingSlideIndex === safeSlideIndex || heroSlides.length === 1}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingSlideIndex === safeSlideIndex ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            {/* Step 2 — shared content */}
            <div className="border-b border-sky-100 bg-sky-50 p-4">
              <div className="mb-4 flex items-center gap-2">
                <StepBadge n={2} />
                <div>
                  <p className="text-sm font-bold text-sky-950">
                    Add content (same on all screens)
                  </p>
                  <p className="text-[11px] text-sky-800/80">
                    Photo, wording, and link are shared across Desktop, iPad, and Mobile
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Banner photo</p>
                  <p className="mb-2 mt-0.5 text-[11px] text-slate-500">
                    Best size: <strong>2400 × 800 px</strong> (wide). Keep the main subject near the
                    center.
                  </p>
                  <MediaUpload
                    label="Upload image"
                    accept="image/*"
                    uploadType="hero-slide"
                    value={slide.image}
                    onChange={(url) => {
                      updateHeroSlide(safeSlideIndex, 'image', url)
                      updateHeroSlide(safeSlideIndex, 'imageFocus', { ...DEFAULT_IMAGE_FOCUS })
                    }}
                    placeholder="Upload or paste image URL"
                  />
                </div>

                <label className="block text-sm">
                  <span className="font-semibold text-slate-800">Headline text</span>
                  <input
                    value={slide.headline}
                    onChange={(e) => updateHeroSlide(safeSlideIndex, 'headline', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Nature Footage in True 4K"
                  />
                </label>

                <label className="block text-sm">
                  <span className="font-semibold text-slate-800">Button text</span>
                  <input
                    value={slide.cta}
                    onChange={(e) => updateHeroSlide(safeSlideIndex, 'cta', e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Browse / View All"
                  />
                  <span className="mt-1 block text-[11px] text-slate-500">
                    Leave empty to hide the button
                  </span>
                </label>

                <label className="block text-sm">
                  <span className="font-semibold text-slate-800">Where should it open?</span>
                  <select
                    value={categorySlugFromLink(slide.link)}
                    onChange={(e) => updateHeroCategory(safeSlideIndex, e.target.value)}
                    className={inputClass}
                  >
                    <option value="">No link (optional)</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.slug}>
                        {category.navLabel}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-[11px] text-slate-500">
                    Selecting a category makes the banner clickable
                  </span>
                </label>

                <div className="space-y-2.5 pt-1">
                  <p className="text-sm font-semibold text-slate-800">Visibility</p>
                  <label className="flex items-center gap-2.5 text-sm font-medium text-slate-800">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={slide.isActive !== false}
                      onChange={(e) =>
                        updateHeroSlide(safeSlideIndex, 'isActive', e.target.checked)
                      }
                    />
                    Show this slide on the website
                  </label>
                  <label className="flex items-center gap-2.5 text-sm font-medium text-slate-800">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={slide.showShadow === true}
                      onChange={(e) =>
                        updateHeroSlide(safeSlideIndex, 'showShadow', e.target.checked)
                      }
                    />
                    Dark shadow on image (makes text easier to read)
                  </label>
                </div>
              </div>
            </div>

            {/* Step 3 — per screen */}
            <div className="border-b border-violet-100 bg-violet-50 p-4">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <StepBadge n={3} />
                  <div>
                    <p className="text-sm font-bold text-violet-950">
                      Style for each screen · now:{' '}
                      <span className="text-indigo-700">{editDeviceLabel}</span>
                    </p>
                    <p className="text-[11px] text-violet-800/80">
                      {deviceHint[editDevice]}. Font, size, crop, and text position change here.
                    </p>
                  </div>
                </div>
                <div className="flex rounded-lg border border-violet-200 bg-white p-0.5">
                  {HERO_EDIT_DEVICES.map((device) => (
                    <button
                      key={device.id}
                      type="button"
                      onClick={() => setEditDevice(device.id)}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                        editDevice === device.id
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {device.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-violet-100 bg-white/80 p-3">
                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    Headline look · {editDeviceLabel}
                  </p>
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Font style</span>
                    <select
                      value={deviceStyle.headlineFontFamily}
                      onChange={(e) =>
                        updateHeroSlideForDevice(safeSlideIndex, editDevice, {
                          headlineFontFamily: e.target.value,
                        })
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
                  <label className="mt-3 block text-sm">
                    <span className="font-medium text-slate-700">
                      Size ({deviceStyle.headlineFontSize}px)
                    </span>
                    <input
                      type="range"
                      min={20}
                      max={96}
                      step={2}
                      value={deviceStyle.headlineFontSize}
                      onChange={(e) =>
                        updateHeroSlideForDevice(safeSlideIndex, editDevice, {
                          headlineFontSize: Number(e.target.value),
                        })
                      }
                      className="mt-2 w-full accent-sky-600"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                      <span>Small</span>
                      <span>Large</span>
                    </div>
                  </label>
                </div>

                <div className="rounded-lg border border-violet-100 bg-white/80 p-3">
                  <p className="mb-3 text-sm font-semibold text-slate-800">
                    Button look · {editDeviceLabel}
                  </p>
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Font style</span>
                    <select
                      value={deviceStyle.ctaFontFamily}
                      onChange={(e) =>
                        updateHeroSlideForDevice(safeSlideIndex, editDevice, {
                          ctaFontFamily: e.target.value,
                        })
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
                  <label className="mt-3 block text-sm">
                    <span className="font-medium text-slate-700">
                      Size ({Math.round(deviceStyle.ctaScale * 100)}%)
                    </span>
                    <input
                      type="range"
                      min={0.6}
                      max={1.8}
                      step={0.05}
                      value={deviceStyle.ctaScale}
                      onChange={(e) =>
                        updateHeroSlideForDevice(safeSlideIndex, editDevice, {
                          ctaScale: Number(e.target.value),
                        })
                      }
                      className="mt-2 w-full accent-violet-600"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                      <span>Small</span>
                      <span>Large</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Live preview · {editDeviceLabel}
                </p>
                <p className="mb-3 mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  1) Drag the image to crop · 2) Zoom in/out · 3) Drag headline and button to
                  position. Switch Desktop / iPad / Mobile to check each screen.
                </p>
                <HeroSlidePreview
                  slide={slide}
                  previewMode={editDevice}
                  onPreviewModeChange={setEditDevice}
                  onImageFocusChange={(imageFocus) =>
                    updateHeroSlide(safeSlideIndex, 'imageFocus', imageFocus)
                  }
                  onPositionChange={(field, position) =>
                    updateHeroSlidePosition(safeSlideIndex, field, position)
                  }
                />
              </div>
            </div>

            {/* Step 4 — save */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-50 p-4">
              <div className="flex items-center gap-2">
                <StepBadge n={4} />
                <p className="text-sm text-emerald-950">
                  Done? Save to update the website.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleSaveSlide(safeSlideIndex)}
                disabled={savingSlideIndex === safeSlideIndex}
                className={`${primaryBtnClass} disabled:opacity-60`}
              >
                {savingSlideIndex === safeSlideIndex
                  ? 'Saving...'
                  : `Save slide ${slideNumber}`}
              </button>
            </div>
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

          <div className="space-y-3 rounded-xl border border-teal-200 bg-teal-50 p-4">
            <p className="text-sm font-semibold text-teal-900">Messages</p>
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
              + Add ticker message
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
