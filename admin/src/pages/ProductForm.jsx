import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  createProduct,
  fetchCategories,
  fetchProduct,
  updateProduct,
} from '../api/client'
import FormStep from '../components/FormStep'
import MediaTypeSelector from '../components/MediaTypeSelector'
import PricingModeSelector from '../components/PricingModeSelector'
import ResolutionTierEditor from '../components/ResolutionTierEditor'
import MediaUpload from '../components/MediaUpload'
import MasterQualitySelector from '../components/MasterQualitySelector'
import VideoPreview from '../components/VideoPreview'
import {
  compactFormClass,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
} from '../components/ui/adminUi'
import { MEDIA_TYPES } from '../constants/mediaTypes'
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

const emptyForm = (mediaType = MEDIA_TYPES.VIDEO) => ({
  mediaType,
  pricingMode: PRICING_MODES.UNIFORM,
  clipId: '',
  name: '',
  categorySlug: '',
  subCategorySlug: '',
  brand: '',
  price: 499,
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
  const navigate = useNavigate()
  const location = useLocation()
  const isEdit = Boolean(id)
  const listState = location.state?.fromList
  const backState = listState ? { restore: listState } : undefined

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showCreateSuccess, setShowCreateSuccess] = useState(false)

  useEffect(() => {
    if (!showCreateSuccess) return undefined
    const timer = window.setTimeout(() => setShowCreateSuccess(false), 4000)
    return () => window.clearTimeout(timer)
  }, [showCreateSuccess])

  useEffect(() => {
    const loadData = async () => {
      try {
        const categoriesRes = await fetchCategories()
        setCategories(categoriesRes.data)

        if (isEdit) {
          const productRes = await fetchProduct(id)
          const product = productRes.data
          const mediaType = product.mediaType || MEDIA_TYPES.VIDEO

          setForm({
            mediaType,
            pricingMode: product.pricingMode || PRICING_MODES.UNIFORM,
            name: product.name,
            clipId: product.clipId || '',
            categorySlug: product.categorySlug,
            subCategorySlug: product.subCategory || '',
            brand: product.brand || '',
            price: product.price,
            availableTiers: mergeAvailableTiers(product),
            resolutionPricing: mergeTierConfig(product),
            rating: product.rating || 0,
            description: product.description || '',
            images: [
              product.images?.[0] || '',
              product.images?.[1] || '',
              product.images?.[2] || '',
            ],
            demoVideo: product.demoVideo || '',
            videoPoster: product.videoPoster || '',
            deliveryFiles: mergeDeliveryFiles(product),
            masterVideoKey: product.masterVideoKey || '',
            masterVideoFilename: product.masterVideoFilename || '',
            masterVideoUrl: product.masterVideoUrl || '',
            masterVideoTier: product.masterVideoTier || '',
            isActive: product.isActive ?? true,
            videoInfo: {
              quality: product.videoInfo?.quality || '',
              fps: product.videoInfo?.fps || '',
              size: product.videoInfo?.size || '',
              duration: product.videoInfo?.duration || '',
              format: product.videoInfo?.format || '',
              orientationNote: product.videoInfo?.orientationNote || '',
            },
          })
        }
      } catch (err) {
        setError(err.message)
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

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
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
      name: current.name,
      categorySlug: current.categorySlug,
      subCategorySlug: current.subCategorySlug,
      brand: current.brand,
      price: current.price,
      rating: current.rating,
      description: current.description,
      images: current.images,
      isActive: current.isActive,
      demoVideo: mediaType === MEDIA_TYPES.VIDEO ? current.demoVideo : '',
      videoPoster: mediaType === MEDIA_TYPES.VIDEO ? current.videoPoster : current.images[0] || '',
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
      videoPoster:
        current.mediaType === MEDIA_TYPES.VIDEO && index === 0 && !current.videoPoster
          ? value
          : current.videoPoster,
    }))
  }

  const validateClient = () => {
    const imageCount = form.images.filter(Boolean).length
    if (!form.name.trim()) return 'Product name is required'
    if (!form.categorySlug) return 'Category is required'
    if (!form.masterVideoTier) {
      return `Select the quality of the master ${isVideo ? 'video' : 'image'} in Step 3`
    }
    if (!form.masterVideoKey.trim()) {
      return `Upload the master ${isVideo ? 'video' : 'image'} in Step 3`
    }
    if (!imageCount) return 'At least one preview image is required'
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
      rating: Number(form.rating),
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
        ? form.videoPoster || form.images.find(Boolean) || ''
        : form.images.find(Boolean) || '',
      masterVideoKey: form.masterVideoKey?.trim() || '',
      masterVideoFilename: form.masterVideoFilename?.trim() || '',
      masterVideoTier: form.masterVideoTier?.trim() || '',
      deliveryFiles: isVideo ? {} : buildImageDeliveryFiles(),
    }

    try {
      if (isEdit) {
        await updateProduct(id, payload)
        navigate('/products', {
          state: listState
            ? { restore: { ...listState, productId: id } }
            : undefined,
        })
      } else {
        await createProduct(payload)
        setForm(emptyForm(form.mediaType))
        setError('')
        setShowCreateSuccess(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading product...</p>
  }

  return (
    <div className="space-y-4">
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

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

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
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Product Name</span>
              <input required value={form.name} onChange={(e) => updateField('name', e.target.value)} className={inputClass} />
            </label>

            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Clip ID</span>
              <input
                value={form.clipId}
                onChange={(e) => updateField('clipId', e.target.value.toUpperCase())}
                placeholder="AKHD-12345 (auto-generated if empty)"
                className={inputClass}
              />
              <p className="mt-1 text-xs text-slate-500">
                Unique stock clip identifier shown to customers. Leave empty to auto-generate.
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
              <span className="font-medium text-slate-700">Brand</span>
              <input value={form.brand} onChange={(e) => updateField('brand', e.target.value)} className={inputClass} />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Rating</span>
              <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => updateField('rating', e.target.value)} className={inputClass} />
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} />
              Visible on storefront
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
          hint={isVideo ? 'Watermarked previews shown to customers on the storefront.' : 'Customer preview images.'}
          tone="emerald"
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {form.images.map((image, index) => (
              <MediaUpload
                key={index}
                label={`Preview Image ${index + 1}`}
                accept="image/jpeg,image/png,image/webp"
                uploadType="preview-image"
                value={image}
                onChange={(url) => updateImage(index, url)}
                valueKind="url"
                placeholder={`Image URL ${index + 1}`}
              />
            ))}
          </div>

          {isVideo && (
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <MediaUpload
                label="Demo Video *"
                accept="video/mp4,video/webm,video/quicktime"
                uploadType="preview-video"
                value={form.demoVideo}
                onChange={(url) => updateField('demoVideo', url)}
                valueKind="url"
                placeholder="https://..."
              />
              <MediaUpload
                label="Video Poster"
                accept="image/jpeg,image/png,image/webp"
                uploadType="video-poster"
                value={form.videoPoster}
                onChange={(url) => updateField('videoPoster', url)}
                valueKind="url"
                placeholder="Defaults to image 1"
              />
              <div className="lg:col-span-2">
                <p className="mb-1 text-xs font-medium text-slate-600">Preview</p>
                <VideoPreview src={form.demoVideo} poster={form.videoPoster || form.images[0]} />
              </div>
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
                    className={`${inputClass} mt-1`}
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

        <div className="flex gap-3 bg-slate-100 px-5 py-3">
          <button type="submit" disabled={saving} className={`${primaryBtnClass} disabled:opacity-60`}>
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <Link to="/products" state={backState} className={secondaryBtnClass}>Cancel</Link>
        </div>
      </form>
    </div>
  )
}

export default ProductForm
