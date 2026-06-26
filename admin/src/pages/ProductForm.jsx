import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  createProduct,
  fetchActors,
  fetchCategories,
  fetchProduct,
  reserveClipId,
  updateProduct,
  uploadMedia,
} from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import FormStickyActions from '../components/FormStickyActions'
import FormStep from '../components/FormStep'
import MediaTypeSelector from '../components/MediaTypeSelector'
import PricingModeSelector from '../components/PricingModeSelector'
import ResolutionTierEditor from '../components/ResolutionTierEditor'
import MediaUpload from '../components/MediaUpload'
import PreviewImageUpload from '../components/PreviewImageUpload'
import MasterQualitySelector from '../components/MasterQualitySelector'
import SearchableSelect from '../components/SearchableSelect'
import PageLoader from '../components/ui/PageLoader'
import {
  compactFormClass,
  inputClass,
  secondaryBtnClass,
} from '../components/ui/adminUi'
import { MEDIA_TYPES } from '../constants/mediaTypes'
import { BRAND } from '../config/brand'
import { captureVideoPosterFromUrl } from '../utils/captureVideoPoster'
import { PRICING_MODES } from '../constants/pricingModes'
import {
  RESOLUTION_ORDER,
  RESOLUTION_TIERS,
  buildDefaultTierConfig,
  sortTierList,
  getDeliverableCustomerTiers,
  getCustomerTiers,
  CUSTOMER_TIER_ORDER,
} from '../constants/resolutionTiers'

const ORIENTATION_NOTE_OPTIONS = [
  'This video is vertical',
  'This video is horizontal',
  'This video is square',
]

const parseListingOrder = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return 0
  return Number.parseInt(digits, 10)
}

const buildEmptyDeliveryFiles = () =>
  Object.fromEntries(
    RESOLUTION_ORDER.map((tier) => [
      tier,
      {
        videoKey: '',
        videoFilename: '',
        imageKeys: ['', '', ''],
        imageFilenames: ['', '', ''],
      },
    ])
  )

const mergeDeliveryFiles = (product = {}) => {
  const source = product.deliveryFiles || {}
  return Object.fromEntries(
    RESOLUTION_ORDER.map((tier) => {
      const stored = source[tier] || {}
      const imageKeys = [...(stored.imageKeys || [])]
      const imageFilenames = [...(stored.imageFilenames || [])]
      while (imageKeys.length < 3) imageKeys.push('')
      while (imageFilenames.length < 3) imageFilenames.push('')
      return [
        tier,
        {
          videoKey: stored.videoKey || '',
          videoFilename: stored.videoFilename || '',
          imageKeys,
          imageFilenames,
        },
      ]
    })
  )
}

const mergeTierConfig = (product = {}) => {
  const source = product.imageSizes || product.resolutionPricing
  const basePrice = Number(product.price) || 499

  const tierList = mergeAvailableTiers(product)

  return Object.fromEntries(
    tierList.map((tier) => {
      const stored = source?.[tier] || {}
      const defaults = RESOLUTION_TIERS[tier] || {}
      const scaled = buildDefaultTierConfig(basePrice)[tier]

      return [
        tier,
        {
          resolution: stored.resolution || defaults.resolution || '',
          size: stored.size || defaults.size || '',
          price: stored.price ?? scaled?.price ?? basePrice,
        },
      ]
    })
  )
}

const mergeAvailableTiers = (product = {}) => {
  const stored = product.availableTiers || []
  const tiers = stored.length
    ? sortTierList(stored)
    : getCustomerTiers([...RESOLUTION_ORDER])

  if (product.masterVideoTier) {
    return getDeliverableCustomerTiers(product.masterVideoTier, tiers)
  }

  return getCustomerTiers(tiers)
}

const buildPreviewImages = (product = {}) => {
  const slots = [
    product.images?.[0] || '',
    product.images?.[1] || '',
    product.images?.[2] || '',
  ]

  if (!slots[0] && product.videoPoster?.trim()) {
    slots[0] = product.videoPoster.trim()
  }

  return slots
}

const mapProductToForm = (product) => {
  const mediaType = product.mediaType || MEDIA_TYPES.VIDEO

  return {
    mediaType,
    pricingMode: product.pricingMode || PRICING_MODES.UNIFORM,
    name: product.name,
    clipId: product.clipId || '',
    categorySlug: product.categorySlug,
    subCategorySlug: product.subCategory || '',
    brand: product.brand || '',
    actorId: product.actorId || '',
    price: product.price,
    gstPercentage: product.gstPercentage ?? 18,
    availableTiers: mergeAvailableTiers(product),
    resolutionPricing: mergeTierConfig(product),
    rating: product.rating || 0,
    description: product.description || '',
    images: buildPreviewImages(product),
    demoVideo: product.demoVideo || '',
    videoPoster: product.videoPoster || '',
    deliveryFiles: mergeDeliveryFiles(product),
    masterVideoKey: product.masterVideoKey || '',
    masterVideoFilename: product.masterVideoFilename || '',
    masterVideoUrl: product.masterVideoUrl || '',
    masterVideoTier: product.masterVideoTier || '',
    isActive: product.isActive ?? true,
    showInLatest: product.showInLatest ?? false,
    actorListingOrder: String(product.actorListingOrder ?? product.allListingOrder ?? 0),
    categoryListingOrder: String(product.categoryListingOrder ?? 0),
    videoInfo: {
      quality: product.videoInfo?.quality || '',
      fps: product.videoInfo?.fps || '',
      size: product.videoInfo?.size || '',
      duration: product.videoInfo?.duration || '',
      format: product.videoInfo?.format || '',
      orientationNote: product.videoInfo?.orientationNote || '',
    },
  }
}

const emptyForm = (mediaType = MEDIA_TYPES.VIDEO) => ({
  mediaType,
  pricingMode: PRICING_MODES.UNIFORM,
  clipId: '',
  name: '',
  categorySlug: '',
  subCategorySlug: '',
  brand: '',
  actorId: '',
  price: 499,
  gstPercentage: 18,
  availableTiers: [],
  resolutionPricing: buildDefaultTierConfig(499),
  rating: 4.5,
  description: '',
  images: ['', '', ''],
  demoVideo: '',
  videoPoster: '',
  deliveryFiles: buildEmptyDeliveryFiles(),
  masterVideoKey: '',
  masterVideoFilename: '',
  masterVideoUrl: '',
  masterVideoTier: '',
  isActive: true,
  showInLatest: false,
  actorListingOrder: '0',
  categoryListingOrder: '0',
  videoInfo: {
    quality: '4K UHD (3840×2160)',
    fps: mediaType === MEDIA_TYPES.VIDEO ? '30 fps' : '',
    size: mediaType === MEDIA_TYPES.VIDEO ? '200 MB' : '18 MB',
    duration: mediaType === MEDIA_TYPES.VIDEO ? '0:15' : '',
    format: mediaType === MEDIA_TYPES.VIDEO ? 'MP4 / H.264' : 'JPEG / PNG',
    orientationNote: mediaType === MEDIA_TYPES.VIDEO ? 'This video is vertical' : '',
  },
})

const ProductForm = () => {
  const { id } = useParams()
  const location = useLocation()
  const isEdit = Boolean(id)
  const listState = location.state?.fromList
  const backState = listState ? { restore: listState } : undefined

  const [categories, setCategories] = useState([])
  const [actors, setActors] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(true)
  const [clipIdLoading, setClipIdLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCreateSuccess, setShowCreateSuccess] = useState(false)
  const [showUpdateSuccess, setShowUpdateSuccess] = useState(false)

  useEffect(() => {
    if (!showCreateSuccess) return undefined
    const timer = window.setTimeout(() => setShowCreateSuccess(false), 4000)
    return () => window.clearTimeout(timer)
  }, [showCreateSuccess])

  const loadClipId = async () => {
    setClipIdLoading(true)
    try {
      const { clipId } = await reserveClipId()
      setForm((current) => ({ ...current, clipId }))
      return clipId
    } catch (err) {
      setError(err.message || 'Could not generate clip ID')
      return ''
    } finally {
      setClipIdLoading(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        const requests = [fetchCategories(), fetchActors()]
        if (!isEdit) {
          requests.push(reserveClipId())
        }

        const results = await Promise.all(requests)
        const categoriesRes = results[0]
        const actorsRes = results[1]

        setCategories(categoriesRes.data)
        setActors(actorsRes.data || [])

        if (isEdit) {
          const productRes = await fetchProduct(id)
          setForm(mapProductToForm(productRes.data))
        } else {
          const clipRes = results[2]
          const clipId = clipRes?.clipId || ''
          if (!clipId) {
            throw new Error('Could not generate clip ID')
          }
          setForm((current) => ({ ...current, clipId }))
        }
      } catch (err) {
        setError(err.message || 'Could not load product form')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, isEdit])

  const isVideo = form.mediaType === MEDIA_TYPES.VIDEO
  const isUniformPricing = form.pricingMode === PRICING_MODES.UNIFORM

  const eligibleTiers = useMemo(() => {
    if (!form.masterVideoTier) return []
    return getDeliverableCustomerTiers(form.masterVideoTier, CUSTOMER_TIER_ORDER)
  }, [form.masterVideoTier])

  const derivedAvailableTiers = useMemo(() => {
    if (!eligibleTiers.length) return []
    return sortTierList(form.availableTiers).filter((tier) => eligibleTiers.includes(tier))
  }, [form.availableTiers, eligibleTiers])

  const selectedCategory = useMemo(
    () => categories.find((category) => category.slug === form.categorySlug),
    [categories, form.categorySlug]
  )

  const actorOptions = useMemo(
    () =>
      actors.map((actor) => ({
        value: actor._id,
        label: actor.name,
        keywords: actor.searchKeywords || [],
      })),
    [actors],
  )

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const saveVideoPoster = async (blob) => {
    const posterFile = new File([blob], 'video-thumbnail.jpg', { type: 'image/jpeg' })
    const response = await uploadMedia(posterFile, 'video-poster', null, {
      clipId: form.clipId,
    })
    return response.data?.url || ''
  }

  const handlePosterCaptured = async (blob) => {
    if (!blob || form.images.some(Boolean) || form.videoPoster?.trim()) return

    try {
      const posterUrl = await saveVideoPoster(blob)
      if (posterUrl) {
        updateField('videoPoster', posterUrl)
      }
    } catch {
      // Storefront can still show a frame from the demo video.
    }
  }

  const handleDemoVideoChange = async (url, meta = {}) => {
    updateField('demoVideo', url)
    if (!url || form.images.some(Boolean) || form.videoPoster?.trim()) return
    if (meta.posterCapturePromise) return

    try {
      const blob = await captureVideoPosterFromUrl(url)
      await handlePosterCaptured(blob)
    } catch {
      // Storefront can still show a frame from the demo video.
    }
  }

  const updatePricingMode = (pricingMode) => {
    setForm((current) => ({
      ...current,
      pricingMode,
      resolutionPricing:
        pricingMode === PRICING_MODES.CUSTOM
          ? mergeTierConfig({
              price: current.price,
              availableTiers: derivedAvailableTiers.length
                ? derivedAvailableTiers
                : current.availableTiers,
              imageSizes: current.resolutionPricing,
              resolutionPricing: current.resolutionPricing,
            })
          : current.resolutionPricing,
    }))
  }

  const updateMasterTier = (masterVideoTier) => {
    const tiers = getDeliverableCustomerTiers(masterVideoTier, CUSTOMER_TIER_ORDER)

    setForm((current) => {
      const preserved = current.availableTiers.filter((tier) => tiers.includes(tier))
      const nextAvailable = preserved.length ? preserved : tiers
      const nextPricing = { ...current.resolutionPricing }

      nextAvailable.forEach((tier) => {
        if (!nextPricing[tier]) {
          nextPricing[tier] = buildDefaultTierConfig(current.price)[tier]
        }
      })

      return {
        ...current,
        masterVideoTier,
        availableTiers: nextAvailable,
        resolutionPricing: nextPricing,
      }
    })
  }

  const toggleAvailableTier = (tier) => {
    setForm((current) => {
      const next = current.availableTiers.includes(tier)
        ? current.availableTiers.filter((item) => item !== tier)
        : [...current.availableTiers, tier]

      return { ...current, availableTiers: sortTierList(next) }
    })
  }

  const updateTierField = (tier, field, value) => {
    setForm((current) => ({
      ...current,
      resolutionPricing: {
        ...current.resolutionPricing,
        [tier]: {
          ...current.resolutionPricing[tier],
          [field]: value,
        },
      },
    }))
  }

  const updateMediaType = (mediaType) => {
    setForm((current) => ({
      ...emptyForm(mediaType),
      mediaType,
      clipId: current.clipId,
      name: current.name,
      categorySlug: current.categorySlug,
      subCategorySlug: current.subCategorySlug,
      brand: current.brand,
      actorId: current.actorId,
      price: current.price,
      gstPercentage: current.gstPercentage,
      rating: current.rating,
      description: current.description,
      images: current.images,
      isActive: current.isActive,
      showInLatest: current.showInLatest,
      actorListingOrder: current.actorListingOrder,
      categoryListingOrder: current.categoryListingOrder,
      demoVideo: mediaType === MEDIA_TYPES.VIDEO ? current.demoVideo : '',
      deliveryFiles: current.deliveryFiles,
    }))
  }

  const updateVideoInfo = (field, value) => {
    setForm((current) => ({
      ...current,
      videoInfo: { ...current.videoInfo, [field]: value },
    }))
  }

  const updateMasterVideo = (key, meta = {}) => {
    setForm((current) => ({
      ...current,
      masterVideoKey: key,
      masterVideoFilename: meta.filename || '',
      masterVideoUrl: meta.url || '',
    }))
  }

  const updateImage = (index, value) => {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index ? value : image
      ),
    }))
  }

  const validateClient = () => {
    if (!form.name.trim()) return 'Product name is required'
    if (!form.clipId.trim()) return 'Clip ID is required — wait a moment and try again'
    if (!form.categorySlug) return 'Category is required'
    if (!form.masterVideoTier) {
      return `Select the quality of the master ${isVideo ? 'video' : 'image'} in Step 3`
    }
    if (!form.masterVideoKey.trim()) {
      return `Upload the master ${isVideo ? 'video' : 'image'} in Step 3`
    }
    if (isVideo && !form.demoVideo.trim()) return 'Demo video URL is required for video products'
    if (!derivedAvailableTiers.length) {
      return 'Select at least one quality for customers in Step 5'
    }

    const missingSize = derivedAvailableTiers.find((tier) => {
      const tierData = form.resolutionPricing?.[tier] || {}
      return !tierData.size?.trim()
    })
    if (missingSize) return `Set file size for ${missingSize} in Step 5`

    if (isUniformPricing) {
      if (!Number(form.price) || Number(form.price) < 0) return 'Valid price is required in Step 5'
    } else {
      const missingPrice = derivedAvailableTiers.find(
        (tier) => !Number(form.resolutionPricing?.[tier]?.price),
      )
      if (missingPrice) return `Enter a price for ${missingPrice} in Step 5`
    }

    if (!Number.isFinite(Number(form.gstPercentage)) || Number(form.gstPercentage) < 0 || Number(form.gstPercentage) > 100) {
      return 'GST percentage must be between 0 and 100'
    }

    return ''
  }

  const buildImageDeliveryFiles = () =>
    Object.fromEntries(
      derivedAvailableTiers.map((tier) => [
        tier,
        {
          videoKey: '',
          videoFilename: '',
          imageKeys: form.masterVideoKey?.trim() ? [form.masterVideoKey.trim()] : [],
          imageFilenames: form.masterVideoFilename?.trim()
            ? [form.masterVideoFilename.trim()]
            : [],
        },
      ]),
    )

  const handleSubmit = async (event) => {
    event.preventDefault()
    const clientError = validateClient()
    if (clientError) {
      setError(clientError)
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      ...form,
      pricingMode: form.pricingMode,
      images: form.images.filter(Boolean),
      price: Number(form.price),
      gstPercentage: Number(form.gstPercentage),
      rating: Number(form.rating),
      actorListingOrder: parseListingOrder(form.actorListingOrder),
      categoryListingOrder: parseListingOrder(form.categoryListingOrder),
      availableTiers: derivedAvailableTiers,
      resolutionPricing: Object.fromEntries(
        derivedAvailableTiers.map((tier) => {
          const tierData = form.resolutionPricing[tier] || {}
          return [
            tier,
            {
              resolution: tierData.resolution?.trim() || RESOLUTION_TIERS[tier]?.resolution || '',
              size: tierData.size?.trim() || RESOLUTION_TIERS[tier]?.size || '',
              price: isUniformPricing
                ? Number(form.price)
                : Number(tierData.price),
            },
          ]
        }),
      ),
      videoPoster: isVideo
        ? form.images.find(Boolean) || form.videoPoster?.trim() || ''
        : form.images.find(Boolean) || '',
      masterVideoKey: form.masterVideoKey?.trim() || '',
      masterVideoFilename: form.masterVideoFilename?.trim() || '',
      masterVideoTier: form.masterVideoTier?.trim() || '',
      deliveryFiles: isVideo ? {} : buildImageDeliveryFiles(),
    }

    try {
      if (isEdit) {
        const { data: savedProduct } = await updateProduct(id, payload)
        setForm(mapProductToForm(savedProduct))
        setShowUpdateSuccess(true)
      } else {
        await createProduct(payload)
        const nextClip = await reserveClipId()
        setForm({ ...emptyForm(form.mediaType), clipId: nextClip.clipId })
        setError('')
        setShowCreateSuccess(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <PageLoader label="Loading product..." />
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Products</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h1>
        </div>
        <Link to="/products" state={backState} className={secondaryBtnClass}>
          Back
        </Link>
      </div>

      <AdminAlertModal
        open={Boolean(error)}
        title="Could not continue"
        message={error}
        onClose={() => setError('')}
      />

      <AdminAlertModal
        open={showUpdateSuccess}
        title="Product updated successfully"
        message="Preview images and demo video are saved."
        variant="success"
        onClose={() => {
          setShowUpdateSuccess(false)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      {showCreateSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Product created successfully</h2>
            <p className="mt-2 text-sm text-slate-600">
              Form cleared — you can add another product now.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateSuccess(false)}
              className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={compactFormClass}>
        <FormStep
          step="1"
          title="What are you selling?"
          hint="Video includes demo clip. Image sells still files only."
          tone="slate"
        >
          <MediaTypeSelector
            value={form.mediaType}
            onChange={updateMediaType}
            disabled={isEdit}
          />
          {isEdit && (
            <p className="mt-2 text-xs text-slate-500">
              Media type cannot be changed after creation.
            </p>
          )}
        </FormStep>

        <FormStep step="2" title="Product details" tone="sky">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Product Name</span>
              <input required value={form.name} onChange={(e) => updateField('name', e.target.value)} className={inputClass} />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Clip ID</span>
              <div className="mt-1 flex gap-2">
                <input
                  readOnly
                  value={
                    clipIdLoading
                      ? 'Generating...'
                      : form.clipId || (isEdit ? '' : 'Not generated')
                  }
                  className={`${inputClass} mt-0 flex-1 bg-slate-50 font-mono text-xs text-slate-700`}
                />
                {!isEdit && !clipIdLoading && !form.clipId ? (
                  <button
                    type="button"
                    onClick={loadClipId}
                    className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Retry
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                AWS folder: products/{form.clipId || 'AKHD-XXXXX'}/...
              </p>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Category</span>
              <select
                required
                value={form.categorySlug}
                onChange={(e) => {
                  updateField('categorySlug', e.target.value)
                  updateField('subCategorySlug', '')
                }}
                className={inputClass}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.slug}>{category.navLabel}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Subcategory</span>
              <select value={form.subCategorySlug} onChange={(e) => updateField('subCategorySlug', e.target.value)} className={inputClass}>
                <option value="">None</option>
                {selectedCategory?.subCategories?.map((subCategory) => (
                  <option key={subCategory.slug} value={subCategory.slug}>{subCategory.name}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Actor</span>
              <SearchableSelect
                value={form.actorId}
                onChange={(value) => updateField('actorId', value)}
                options={actorOptions}
                emptyLabel="No actor"
                searchPlaceholder="Search actors..."
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Link this product to an actor so customers can find it by actor name or keywords in search.
              </p>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Brand</span>
              <input value={form.brand} onChange={(e) => updateField('brand', e.target.value)} className={inputClass} />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Rating</span>
              <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => updateField('rating', e.target.value)} className={inputClass} />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">GST Percentage</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.gstPercentage}
                onChange={(e) => updateField('gstPercentage', e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Actor page position</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.actorListingOrder}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '')
                  updateField('actorListingOrder', digits)
                }}
                className={inputClass}
                placeholder="e.g. 0"
              />
              <p className="mt-1 text-xs text-slate-500">
                Position when a customer opens this actor&apos;s footage page. Lower numbers appear first (0, 1, 2…).
              </p>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Category page position</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.categoryListingOrder}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '')
                  updateField('categoryListingOrder', digits)
                }}
                className={inputClass}
                placeholder="e.g. 0"
              />
              <p className="mt-1 text-xs text-slate-500">
                Position within this product&apos;s category page. Lower numbers appear first (0, 1, 2…).
              </p>
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} />
              Visible on {BRAND.websiteLabel}
            </label>

            <label className="flex items-start gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={form.showInLatest}
                onChange={(e) => updateField('showInLatest', e.target.checked)}
              />
              <span>
                Add to Latest Uploads (homepage)
                <p className="mt-1 text-xs font-normal text-slate-500">
                  Tick this if you want this product available in the Latest Uploads row on the
                  homepage. After saving, pin it from Admin → Home Products → Latest Uploads.
                </p>
              </span>
            </label>

            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Description</span>
              <textarea rows={2} value={form.description} onChange={(e) => updateField('description', e.target.value)} className={inputClass} />
            </label>
          </div>
        </FormStep>

        <FormStep
          step="3"
          title="Master delivery file"
          hint={
            isVideo
              ? 'Select master quality, then upload the original video. Customers receive this same master file for every quality tier they purchase.'
              : 'Select master quality, then upload the original image file.'
          }
          tone="amber"
        >
          <div className="space-y-4">
            <MasterQualitySelector
              value={form.masterVideoTier}
              onChange={updateMasterTier}
              showGenerated={false}
            />

            <MediaUpload
              label={isVideo ? 'Master Original Video *' : 'Master Original Image *'}
              accept={
                isVideo
                  ? 'video/*,.mp4,.mov,.mkv,.webm,.mxf,.prores'
                  : 'image/*,.jpg,.jpeg,.png,.webp,.tiff,.tif,.raw,.dng'
              }
              uploadType={isVideo ? 'master-video' : 'master-image'}
              clipId={form.clipId}
              value={form.masterVideoKey}
              filename={form.masterVideoFilename}
              accessUrl={form.masterVideoUrl}
              onChange={updateMasterVideo}
              valueKind="key"
              showAccessUrl={Boolean(form.masterVideoUrl)}
              placeholder="Storage key (auto-filled after upload)"
              disabled={!form.masterVideoTier}
            />

            {!form.masterVideoTier && (
              <p className="text-xs text-amber-700">
                Select master quality above before uploading the file.
              </p>
            )}

            <p className="text-xs text-slate-500">
              No file size limit in admin. Upload any size master video or image — large files stream
              directly to storage without loading into server memory.
            </p>

            {isVideo && form.masterVideoKey && (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                Master file uploaded. All purchased quality tiers will deliver this same file.
              </p>
            )}
          </div>
        </FormStep>

        <FormStep
          step="4"
          title={isVideo ? 'Preview images + demo video' : 'Preview images'}
          hint={isVideo ? `Watermarked previews shown to customers on the ${BRAND.websiteLabel}.` : 'Customer preview images.'}
          tone="emerald"
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {form.images.map((image, index) => (
              <PreviewImageUpload
                key={`preview-image-${index}-${image || 'empty'}`}
                label={`Preview Image ${index + 1}`}
                clipId={form.clipId}
                previewIndex={index + 1}
                value={image}
                onChange={(url) => updateImage(index, url)}
                placeholder={`Image URL ${index + 1}`}
              />
            ))}
          </div>

          {isVideo && (
            <div className="mt-3">
              <MediaUpload
                key={`demo-video-${form.demoVideo || 'empty'}`}
                label="Demo Video *"
                accept="video/mp4,video/webm,video/quicktime"
                uploadType="preview-video"
                clipId={form.clipId}
                value={form.demoVideo}
                onChange={handleDemoVideoChange}
                autoCapturePoster
                onPosterCaptured={handlePosterCaptured}
                valueKind="url"
                placeholder="https://..."
              />
            </div>
          )}
        </FormStep>

        <FormStep
          step="5"
          title="Video & image resolution"
          hint="Qualities are set automatically from your master upload in Step 3."
          tone="violet"
        >
          {!form.masterVideoTier ? (
            <p className="text-sm text-slate-500">
              Complete Step 3 first — select master quality and upload your file.
            </p>
          ) : (
            <>
              <p className="mb-4 text-xs text-slate-500">
                Master upload: <strong>{form.masterVideoTier}</strong> — tick the top-right checkbox on each quality you want to sell.
              </p>

              <div className="mb-4">
                <PricingModeSelector value={form.pricingMode} onChange={updatePricingMode} />
              </div>

              {isUniformPricing && (
                <label className="mb-4 block max-w-xs text-sm">
                  <span className="font-medium text-slate-700">Price for all resolutions (₹)</span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    className={`${inputClass} no-number-spinner mt-1`}
                  />
                </label>
              )}

              <ResolutionTierEditor
                order={eligibleTiers}
                tiers={form.resolutionPricing}
                selectedTiers={form.availableTiers}
                onToggleTier={toggleAvailableTier}
                showPrice={!isUniformPricing}
                uniformPrice={form.price}
                onFieldChange={updateTierField}
              />
            </>
          )}
        </FormStep>

        <FormStep
          step="6"
          title={isVideo ? 'Video file info' : 'Image file info'}
          tone="slate"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Max Quality</span>
              <input value={form.videoInfo.quality} onChange={(e) => updateVideoInfo('quality', e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">File Size</span>
              <input value={form.videoInfo.size} onChange={(e) => updateVideoInfo('size', e.target.value)} className={inputClass} />
            </label>
            {isVideo && (
              <>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">FPS</span>
                  <input value={form.videoInfo.fps} onChange={(e) => updateVideoInfo('fps', e.target.value)} className={inputClass} />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Duration</span>
                  <input value={form.videoInfo.duration} onChange={(e) => updateVideoInfo('duration', e.target.value)} className={inputClass} />
                </label>
              </>
            )}
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Format</span>
              <input value={form.videoInfo.format} onChange={(e) => updateVideoInfo('format', e.target.value)} className={inputClass} />
            </label>
            {isVideo && (
              <label className="block text-sm sm:col-span-2">
                <span className="font-medium text-slate-700">Orientation note</span>
                <select
                  value={form.videoInfo.orientationNote}
                  onChange={(e) => updateVideoInfo('orientationNote', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Select orientation note</option>
                  {ORIENTATION_NOTE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </FormStep>

        <FormStickyActions
          cancelTo="/products"
          cancelState={backState}
          saving={saving}
          submitLabel={isEdit ? 'Update Product' : 'Create Product'}
        />
      </form>
    </div>
  )
}

export default ProductForm
