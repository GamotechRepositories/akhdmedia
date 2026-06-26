import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchAdminProducts,
  fetchHomeCategoryPins,
  updateCategoryHomePins,
  updateHomeLatestPins,
} from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import PageLoader from '../components/ui/PageLoader'
import StatusBadge from '../components/StatusBadge'
import {
  actionDeleteClass,
  inputClass,
  sectionClass,
} from '../components/ui/adminUi'
import { ADMIN_PERMISSIONS } from '../constants/adminPermissions'
import { useAuth } from '../context/AuthContext'

const PIN_LIMIT = 8

const HOME_PRODUCT_GRID =
  'grid grid-cols-2 gap-3.5 sm:gap-5 md:gap-6 lg:grid-cols-3 xl:grid-cols-4'

const LATEST_SECTION_ID = 'latest-uploads'

const reorderList = (items, fromIndex, toIndex) => {
  const next = [...items]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}

const DragHandleIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path d="M7 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM7 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM7 13a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
  </svg>
)

const formatProductCount = (count = 0) =>
  `${Number(count).toLocaleString('en-IN')} ${Number(count) === 1 ? 'product' : 'products'}`

const ProductCountBadge = ({ count }) => (
  <span className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
    {formatProductCount(count)}
  </span>
)

const getProductThumbnail = (product) =>
  product.thumbnail ||
  (product.images || []).find(Boolean) ||
  product.videoPoster ||
  ''

const ProductSearchPicker = ({
  categorySlug = 'all',
  searchPlaceholder = 'Search products...',
  pinnedIds,
  disabled,
  onSelect,
}) => {
  const containerRef = useRef(null)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query), 300)
    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!open) return undefined

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (!open || disabled) {
      setResults([])
      return undefined
    }

    let cancelled = false

    const loadResults = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetchAdminProducts({
          page: 1,
          limit: 20,
          search: debouncedQuery,
          categorySlug: categorySlug === 'all' ? 'all' : categorySlug,
          status: 'all',
        })
        if (cancelled) return

        const pinnedSet = new Set(pinnedIds)
        const products = (response.data?.data?.products || [])
          .filter((product) => !pinnedSet.has(product.id))
          .map((product) => ({
            id: product.id,
            name: product.name,
            clipId: product.clipId || '',
            thumbnail: (product.images || []).find(Boolean) || product.videoPoster || '',
            isActive: product.isActive,
          }))

        setResults(products)
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setResults([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadResults()
    return () => {
      cancelled = true
    }
  }, [open, debouncedQuery, categorySlug, pinnedIds, disabled])

  const handleSelect = (product) => {
    onSelect(product)
    setQuery('')
    setDebouncedQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        disabled={disabled}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={disabled ? 'Maximum 8 products pinned' : searchPlaceholder}
        className={`${inputClass} mt-0 disabled:cursor-not-allowed disabled:bg-slate-100`}
      />

      {open && !disabled ? (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {loading ? (
            <p className="px-3 py-3 text-sm text-slate-500">Searching products...</p>
          ) : error ? (
            <p className="px-3 py-3 text-sm text-red-600">{error}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-500">
              {debouncedQuery.trim() ? 'No matching products found.' : 'Type to search products.'}
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1">
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(product)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-slate-50"
                  >
                    {product.thumbnail ? (
                      <img
                        src={product.thumbnail}
                        alt={product.name}
                        className="h-10 w-14 shrink-0 rounded-md object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">
                        —
                      </div>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">
                        {product.name}
                      </span>
                      {product.clipId ? (
                        <span className="mt-0.5 block font-mono text-[11px] text-slate-500">
                          {product.clipId}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  )
}

const PinnedProductsGrid = ({
  pinnedProducts,
  canWrite,
  saving,
  onRemove,
  onReorder,
  emptyMessage,
}) => {
  const [dragIndex, setDragIndex] = useState(null)
  const [overIndex, setOverIndex] = useState(null)
  const canReorder = canWrite && Boolean(onReorder) && !saving && pinnedProducts.length > 1

  const handleDrop = (targetIndex) => {
    if (dragIndex === null || dragIndex === targetIndex || !onReorder) return
    onReorder(dragIndex, targetIndex)
    setDragIndex(null)
    setOverIndex(null)
  }

  if (pinnedProducts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className={HOME_PRODUCT_GRID}>
      {pinnedProducts.map((product, index) => {
        const isDragging = dragIndex === index
        const isDropTarget = overIndex === index && dragIndex !== null && dragIndex !== index

        return (
          <article
            key={product.id}
            draggable={canReorder}
            onDragStart={() => setDragIndex(index)}
            onDragOver={(event) => {
              if (!canReorder || dragIndex === null) return
              event.preventDefault()
              setOverIndex(index)
            }}
            onDrop={(event) => {
              event.preventDefault()
              handleDrop(index)
            }}
            onDragEnd={() => {
              setDragIndex(null)
              setOverIndex(null)
            }}
            className={`group relative w-full min-w-0 transition ${
              isDragging ? 'scale-[0.98] opacity-50' : ''
            } ${isDropTarget ? 'rounded-xl ring-2 ring-slate-900 ring-offset-2' : ''} ${
              canReorder ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-900 shadow-sm sm:rounded-xl">
              {getProductThumbnail(product) ? (
                <img
                  src={getProductThumbnail(product)}
                  alt={product.name}
                  draggable={false}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-400">
                  No preview
                </div>
              )}
              <span className="absolute left-1.5 top-1.5 z-20 rounded-full bg-black/85 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm sm:left-[4%] sm:top-[4%]">
                #{index + 1}
              </span>
              {canReorder ? (
                <span
                  className="absolute right-1.5 top-1.5 z-20 inline-flex items-center justify-center rounded bg-black/85 p-1.5 text-white shadow-sm sm:right-[4%] sm:top-[4%]"
                  title="Drag to reorder"
                >
                  <DragHandleIcon />
                </span>
              ) : null}
            </div>

            <div className="mt-[0.55em] px-[0.1em]">
              <h3 className="line-clamp-2 text-[11px] font-medium leading-snug text-gray-900 sm:text-sm">
                {product.name}
              </h3>
              {product.clipId ? (
                <p className="mt-0.5 truncate font-mono text-[10px] text-gray-500 sm:text-xs">
                  {product.clipId}
                </p>
              ) : null}
              <div className="mt-2 flex items-center justify-between gap-2">
                <StatusBadge active={product.isActive} />
                {canWrite ? (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => onRemove(product.id)}
                    className={`${actionDeleteClass} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

const LatestPinSection = ({ latest, canWrite, saving, onAdd, onRemove, onReorder }) => {
  const pinnedProducts = latest?.pinnedProducts || []
  const pinnedIds = pinnedProducts.map((product) => product.id)
  const atLimit = pinnedProducts.length >= PIN_LIMIT

  return (
    <section className={`${sectionClass} ring-2 ring-slate-900/10`}>
      <div className="border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900">{latest?.title || 'Latest Uploads'}</h2>
          <ProductCountBadge count={latest?.productCount ?? 0} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Homepage latest row · {pinnedProducts.length}/{PIN_LIMIT} pinned
          {canWrite && pinnedProducts.length > 1 ? ' · drag cards to reorder' : ''}
        </p>
      </div>

      {canWrite ? (
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">Add product</label>
          <ProductSearchPicker
            categorySlug="all"
            searchPlaceholder="Search any product to pin in Latest Uploads..."
            pinnedIds={pinnedIds}
            disabled={atLimit || saving}
            onSelect={onAdd}
          />
        </div>
      ) : null}

      <div className="mt-5">
        <PinnedProductsGrid
          pinnedProducts={pinnedProducts}
          canWrite={canWrite}
          saving={saving}
          onRemove={onRemove}
          onReorder={onReorder}
          emptyMessage="No products pinned yet for Latest Uploads."
        />
      </div>
    </section>
  )
}

const CategoryPinSection = ({
  category,
  canWrite,
  saving,
  onAdd,
  onRemove,
  onReorder,
}) => {
  const pinnedProducts = category.pinnedProducts || []
  const pinnedIds = pinnedProducts.map((product) => product.id)
  const atLimit = pinnedProducts.length >= PIN_LIMIT

  return (
    <section className={sectionClass}>
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">{category.label}</h2>
            <ProductCountBadge count={category.productCount ?? 0} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {category.navLabel} · {pinnedProducts.length}/{PIN_LIMIT} pinned for homepage
            {canWrite && pinnedProducts.length > 1 ? ' · drag cards to reorder' : ''}
          </p>
        </div>
        {!category.isActive ? (
          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
            Inactive category
          </span>
        ) : null}
      </div>

      {canWrite ? (
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">
            Add product
          </label>
          <ProductSearchPicker
            categorySlug={category.slug}
            searchPlaceholder="Search products in this category..."
            pinnedIds={pinnedIds}
            disabled={atLimit || saving}
            onSelect={(product) => onAdd(category.id, product)}
          />
        </div>
      ) : null}

      <div className="mt-5">
        <PinnedProductsGrid
          pinnedProducts={pinnedProducts}
          canWrite={canWrite}
          saving={saving}
          onRemove={(productId) => onRemove(category.id, productId)}
          onReorder={(fromIndex, toIndex) => onReorder(category.id, fromIndex, toIndex)}
          emptyMessage="No products pinned yet for this category."
        />
      </div>
    </section>
  )
}

const HomeCategoryProducts = () => {
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(ADMIN_PERMISSIONS.HOME_CONTENT_MANAGE)
  const [categories, setCategories] = useState([])
  const [latest, setLatest] = useState({
    title: 'Latest Uploads',
    productCount: 0,
    pinnedProducts: [],
  })
  const [loading, setLoading] = useState(true)
  const [savingCategoryId, setSavingCategoryId] = useState('')
  const [savingLatest, setSavingLatest] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState(LATEST_SECTION_ID)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedSectionId) ?? null,
    [categories, selectedSectionId],
  )

  const loadPins = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetchHomeCategoryPins()
      setCategories(response.data?.data || [])
      setLatest(
        response.data?.latest || {
          title: 'Latest Uploads',
          productCount: 0,
          pinnedProducts: [],
        },
      )
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPins()
  }, [loadPins])

  const persistPins = async (categoryId, productIds) => {
    setSavingCategoryId(categoryId)
    setError('')
    setSuccess('')
    try {
      const response = await updateCategoryHomePins(categoryId, productIds)
      const updatedCategory = response.data?.data
      if (updatedCategory) {
        setCategories((current) =>
          current.map((category) =>
            category.id === updatedCategory.id
              ? {
                  ...category,
                  ...updatedCategory,
                  productCount: updatedCategory.productCount ?? category.productCount ?? 0,
                }
              : category,
          ),
        )
      }
      setSuccess('Homepage products updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingCategoryId('')
    }
  }

  const handleAdd = (categoryId, product) => {
    const category = categories.find((entry) => entry.id === categoryId)
    if (!category) return

    const nextIds = [...(category.pinnedProducts || []).map((entry) => entry.id), product.id]
    persistPins(categoryId, nextIds)
  }

  const handleRemove = (categoryId, productId) => {
    const category = categories.find((entry) => entry.id === categoryId)
    if (!category) return

    const nextIds = (category.pinnedProducts || [])
      .map((entry) => entry.id)
      .filter((id) => id !== productId)

    persistPins(categoryId, nextIds)
  }

  const handleCategoryReorder = (categoryId, fromIndex, toIndex) => {
    const category = categories.find((entry) => entry.id === categoryId)
    if (!category) return

    const reordered = reorderList(category.pinnedProducts || [], fromIndex, toIndex)
    const nextIds = reordered.map((product) => product.id)

    setCategories((current) =>
      current.map((entry) =>
        entry.id === categoryId ? { ...entry, pinnedProducts: reordered } : entry,
      ),
    )
    persistPins(categoryId, nextIds)
  }

  const persistLatestPins = async (productIds) => {
    setSavingLatest(true)
    setError('')
    setSuccess('')
    try {
      const response = await updateHomeLatestPins(productIds)
      const updatedLatest = response.data?.data
      if (updatedLatest) {
        setLatest((current) => ({
          ...current,
          ...updatedLatest,
          productCount: updatedLatest.productCount ?? current.productCount ?? 0,
        }))
      }
      setSuccess('Homepage products updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingLatest(false)
    }
  }

  const handleLatestAdd = (product) => {
    const nextIds = [...(latest.pinnedProducts || []).map((entry) => entry.id), product.id]
    persistLatestPins(nextIds)
  }

  const handleLatestRemove = (productId) => {
    const nextIds = (latest.pinnedProducts || [])
      .map((entry) => entry.id)
      .filter((id) => id !== productId)

    persistLatestPins(nextIds)
  }

  const handleLatestReorder = (fromIndex, toIndex) => {
    const reordered = reorderList(latest.pinnedProducts || [], fromIndex, toIndex)
    const nextIds = reordered.map((product) => product.id)

    setLatest((current) => ({
      ...current,
      pinnedProducts: reordered,
    }))
    persistLatestPins(nextIds)
  }

  if (loading) {
    return <PageLoader label="Loading homepage category products..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Homepage Products</h1>
          <label className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 lg:min-w-[280px] lg:flex-1 lg:max-w-md">
            <span className="sr-only">Select homepage section</span>
            <select
              value={selectedSectionId}
              onChange={(event) => setSelectedSectionId(event.target.value)}
              className={`${inputClass} mt-0 w-full sm:min-w-[240px]`}
            >
              <option value={LATEST_SECTION_ID}>Latest Uploads</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-sm text-slate-500">
          Pin up to 8 products for Latest Uploads and up to 8 per category. Only pinned products
          appear on the homepage.
        </p>
      </div>

      {success ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </p>
      ) : null}

      {!canWrite ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You can view pinned products, but only admins with homepage permission can add or remove them.
        </p>
      ) : null}

      <div className="space-y-6">
        {selectedSectionId === LATEST_SECTION_ID ? (
          <LatestPinSection
            latest={latest}
            canWrite={canWrite}
            saving={savingLatest}
            onAdd={handleLatestAdd}
            onRemove={handleLatestRemove}
            onReorder={handleLatestReorder}
          />
        ) : null}

        {selectedCategory ? (
          <CategoryPinSection
            key={selectedCategory.id}
            category={selectedCategory}
            canWrite={canWrite}
            saving={savingCategoryId === selectedCategory.id}
            onAdd={handleAdd}
            onRemove={handleRemove}
            onReorder={handleCategoryReorder}
          />
        ) : null}
      </div>

      <AdminAlertModal
        open={Boolean(error)}
        title="Could not update homepage products"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default HomeCategoryProducts
