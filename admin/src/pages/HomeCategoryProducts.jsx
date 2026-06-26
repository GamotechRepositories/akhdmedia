import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchAdminProducts,
  fetchHomeCategoryPins,
  updateCategoryHomePins,
  updateHomeLatestPins,
} from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import AdminPageHeader from '../components/ui/AdminPageHeader'
import PageLoader from '../components/ui/PageLoader'
import StatusBadge from '../components/StatusBadge'
import {
  actionDeleteClass,
  cardClass,
  inputClass,
  sectionClass,
} from '../components/ui/adminUi'
import { ADMIN_PERMISSIONS } from '../constants/adminPermissions'
import { useAuth } from '../context/AuthContext'

const PIN_LIMIT = 8

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
  showInLatestOnly = false,
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
          showInLatest: showInLatestOnly,
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
  }, [open, debouncedQuery, categorySlug, showInLatestOnly, pinnedIds, disabled])

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

const PinnedProductsGrid = ({ pinnedProducts, canWrite, saving, onRemove, emptyMessage }) => {
  if (pinnedProducts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {pinnedProducts.map((product, index) => (
        <div key={product.id} className={`${cardClass} overflow-hidden`}>
          <div className="relative aspect-video bg-slate-100">
            {getProductThumbnail(product) ? (
              <img
                src={getProductThumbnail(product)}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No preview
              </div>
            )}
            <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-bold text-white">
              #{index + 1}
            </span>
          </div>
          <div className="space-y-2 p-3">
            <div>
              <p className="line-clamp-2 text-sm font-semibold text-slate-900">{product.name}</p>
              {product.clipId ? (
                <p className="mt-0.5 font-mono text-[11px] text-slate-500">{product.clipId}</p>
              ) : null}
            </div>
            <div className="flex items-center justify-between gap-2">
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
        </div>
      ))}
    </div>
  )
}

const LatestPinSection = ({ latest, canWrite, saving, onAdd, onRemove }) => {
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
          Homepage latest row · {pinnedProducts.length}/{PIN_LIMIT} pinned · only products with
          “Add to Latest Uploads (homepage)” enabled
        </p>
      </div>

      {canWrite ? (
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700">Add product</label>
          <ProductSearchPicker
            categorySlug="all"
            showInLatestOnly
            searchPlaceholder="Search Latest-eligible products..."
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
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

  if (loading) {
    return <PageLoader label="Loading homepage category products..." />
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Homepage Products"
        description="Pin up to 8 products for Latest Uploads and up to 8 per category. Only pinned products appear on the homepage."
      />

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
        <LatestPinSection
          latest={latest}
          canWrite={canWrite}
          saving={savingLatest}
          onAdd={handleLatestAdd}
          onRemove={handleLatestRemove}
        />

        {categories.map((category) => (
          <CategoryPinSection
            key={category.id}
            category={category}
            canWrite={canWrite}
            saving={savingCategoryId === category.id}
            onAdd={handleAdd}
            onRemove={handleRemove}
          />
        ))}
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
