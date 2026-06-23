import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { deleteProduct, fetchAdminProducts, fetchCategories } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import StatusBadge from '../components/StatusBadge'
import AdminPagination from '../components/ui/AdminPagination'
import AdminTable from '../components/ui/AdminTable'
import {
  actionDeleteClass,
  actionEditClass,
  actionGroupClass,
  cardClass,
  inputClass,
  primaryBtnClass,
  tableBodyClass,
  tableEmptyClass,
  tableHeadClass,
  tableRowClass,
  tdClass,
  tdHideMd,
  tdPrimaryClass,
  tdRightClass,
  thClass,
  thHideMd,
  thRightClass,
} from '../components/ui/adminUi'
import { ADMIN_PERMISSIONS } from '../constants/adminPermissions'
import { useAuth } from '../context/AuthContext'

const PAGE_SIZE = 50

const TYPE_FILTERS = [
  { id: 'all', label: 'All types' },
  { id: 'video', label: 'Video' },
  { id: 'image', label: 'Image' },
]

const STATUS_FILTERS = [
  { id: 'all', label: 'All statuses' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
]

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const buildProductsCacheKey = (page, filters) =>
  `${filters.search}|${filters.mediaType}|${filters.categorySlug}|${filters.status}::${page}`

const productsPageCache = new Map()
const productsInFlight = new Map()

const clearProductsRequestCache = () => {
  productsPageCache.clear()
  productsInFlight.clear()
}

const Products = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canWrite = hasPermission(ADMIN_PERMISSIONS.PRODUCTS_WRITE)
  const tableContainerRef = useRef(null)
  const skipSearchResetRef = useRef(true)
  const restore = location.state?.restore

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState(restore?.searchQuery || '')
  const [debouncedSearch, setDebouncedSearch] = useState(restore?.searchQuery || '')
  const [typeFilter, setTypeFilter] = useState(restore?.typeFilter || 'all')
  const [categoryFilter, setCategoryFilter] = useState(restore?.categoryFilter || 'all')
  const [statusFilter, setStatusFilter] = useState(restore?.statusFilter || 'all')
  const [highlightedId, setHighlightedId] = useState('')
  const [currentPage, setCurrentPage] = useState(restore?.page || 1)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (skipSearchResetRef.current) {
      skipSearchResetRef.current = false
      return
    }

    setCurrentPage(1)
    clearProductsRequestCache()
  }, [debouncedSearch])

  const invalidateProductCache = useCallback(() => {
    clearProductsRequestCache()
  }, [])

  const applyCachedPage = useCallback((cached) => {
    setProducts(cached.products)
    setTotalCount(cached.totalCount)
    setTotalPages(cached.totalPages)
    setLoading(false)
    setError('')
  }, [])

  const loadProducts = useCallback(
    async ({ force = false } = {}) => {
      const cacheKey = buildProductsCacheKey(currentPage, {
        search: debouncedSearch,
        mediaType: typeFilter,
        categorySlug: categoryFilter,
        status: statusFilter,
      })

      if (!force) {
        const cached = productsPageCache.get(cacheKey)
        if (cached) {
          applyCachedPage(cached)
          return
        }

        const inFlight = productsInFlight.get(cacheKey)
        if (inFlight) {
          setLoading(true)
          try {
            await inFlight
            const cachedAfter = productsPageCache.get(cacheKey)
            if (cachedAfter) {
              applyCachedPage(cachedAfter)
            }
          } catch (err) {
            setError(err.message)
          } finally {
            setLoading(false)
          }
          return
        }
      }

      setLoading(true)
      setError('')

      const request = (async () => {
        const response = await fetchAdminProducts({
          page: currentPage,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          mediaType: typeFilter,
          categorySlug: categoryFilter,
          status: statusFilter,
        })

        const payload = response.data?.data || {}
        const nextProducts = payload.products || []
        const nextTotalCount = payload.pagination?.total || 0
        const nextTotalPages = payload.pagination?.totalPages || 1

        productsPageCache.set(cacheKey, {
          products: nextProducts,
          totalCount: nextTotalCount,
          totalPages: nextTotalPages,
        })

        return {
          products: nextProducts,
          totalCount: nextTotalCount,
          totalPages: nextTotalPages,
        }
      })()

      if (!force) {
        productsInFlight.set(cacheKey, request)
      }

      try {
        const result = await request
        setProducts(result.products)
        setTotalCount(result.totalCount)
        setTotalPages(result.totalPages)
      } catch (err) {
        setError(err.message)
        setProducts([])
        setTotalCount(0)
        setTotalPages(1)
      } finally {
        productsInFlight.delete(cacheKey)
        setLoading(false)
      }
    },
    [
      applyCachedPage,
      currentPage,
      debouncedSearch,
      typeFilter,
      categoryFilter,
      statusFilter,
    ],
  )

  useEffect(() => {
    fetchCategories()
      .then((response) => setCategories(response.data || []))
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    const nextRestore = location.state?.restore
    if (!nextRestore) return

    invalidateProductCache()

    if (nextRestore.searchQuery !== undefined) {
      setSearchQuery(nextRestore.searchQuery)
      setDebouncedSearch(nextRestore.searchQuery)
    }
    if (nextRestore.typeFilter) setTypeFilter(nextRestore.typeFilter)
    if (nextRestore.categoryFilter) setCategoryFilter(nextRestore.categoryFilter)
    if (nextRestore.statusFilter) setStatusFilter(nextRestore.statusFilter)
    if (nextRestore.page) setCurrentPage(nextRestore.page)

    const frame = requestAnimationFrame(() => {
      if (tableContainerRef.current && typeof nextRestore.scrollTop === 'number') {
        tableContainerRef.current.scrollTop = nextRestore.scrollTop
      }

      if (nextRestore.productId) {
        setHighlightedId(nextRestore.productId)
        const row = document.getElementById(`product-row-${nextRestore.productId}`)
        row?.scrollIntoView({ block: 'center', behavior: 'auto' })
        window.setTimeout(() => setHighlightedId(''), 2500)
      }

      navigate('/products', { replace: true, state: {} })
    })

    return () => cancelAnimationFrame(frame)
  }, [location.state, navigate, invalidateProductCache])

  const hasActiveFilters =
    searchQuery.trim() ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all'

  const clearFilters = () => {
    clearProductsRequestCache()
    setSearchQuery('')
    setDebouncedSearch('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setStatusFilter('all')
    setCurrentPage(1)
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return

    try {
      await deleteProduct(product.id)
      invalidateProductCache()
      if (products.length === 1 && currentPage > 1) {
        setCurrentPage((page) => page - 1)
      } else {
        await loadProducts({ force: true })
      }
    } catch (err) {
      window.alert(err.message)
    }
  }

  const listStart = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const listEnd = Math.min(currentPage * PAGE_SIZE, totalCount)

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block min-w-0 flex-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Search products
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, clip ID, category, brand, price, description..."
              className={inputClass}
            />
          </label>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear filters
              </button>
            )}
            {canWrite ? (
              <Link to="/products/new" className={`${primaryBtnClass} !w-auto shrink-0`}>
                Add Product
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Type
            </span>
            <select
              value={typeFilter}
              onChange={(e) => {
                clearProductsRequestCache()
                setTypeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className={inputClass}
            >
              {TYPE_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Category
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => {
                clearProductsRequestCache()
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className={inputClass}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category._id || category.slug} value={category.slug}>
                  {category.navLabel}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(e) => {
                clearProductsRequestCache()
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className={inputClass}
            >
              {STATUS_FILTERS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!loading && (
          <p className="text-xs text-slate-500">
            {totalCount === 0
              ? 'No products match your filters.'
              : `Showing ${listStart}-${listEnd} of ${totalCount} products`}
          </p>
        )}
      </div>

      <AdminTable ref={tableContainerRef} maxHeight className="min-h-[240px]">
        <thead className={tableHeadClass}>
          <tr>
            <th className={thClass}>Name</th>
            <th className={thClass}>Type</th>
            <th className={thHideMd}>Category</th>
            <th className={thClass}>Price</th>
            <th className={thClass}>Status</th>
            <th className={thRightClass}>Actions</th>
          </tr>
        </thead>
        <tbody className={tableBodyClass}>
          {loading ? (
            <tr>
              <td colSpan={6} className={tableEmptyClass}>
                Loading products...
              </td>
            </tr>
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={6} className={tableEmptyClass}>
                {hasActiveFilters
                  ? 'No products match your search or filters.'
                  : 'No products found.'}
              </td>
            </tr>
          ) : (
            products.map((product) => (
              <tr
                key={product.id}
                id={`product-row-${product.id}`}
                className={`${tableRowClass} ${
                  highlightedId === product.id ? 'bg-amber-50 ring-1 ring-inset ring-amber-200' : ''
                }`}
              >
                <td className={tdPrimaryClass}>
                  <p>{product.name}</p>
                  {product.clipId && (
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">{product.clipId}</p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-500 md:hidden">{product.category}</p>
                </td>
                <td className={tdClass}>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
                    {product.mediaType === 'image' ? 'Image' : 'Video'}
                  </span>
                </td>
                <td className={`${tdHideMd} text-slate-600`}>{product.category}</td>
                <td className={tdClass}>{formatCurrency(product.price)}</td>
                <td className={tdClass}>
                  <StatusBadge active={product.isActive} />
                </td>
                <td className={tdRightClass}>
                  {canWrite ? (
                    <div className={actionGroupClass}>
                      <Link
                        to={`/products/${product.id}/edit`}
                        state={{
                          fromList: {
                            searchQuery,
                            typeFilter,
                            categoryFilter,
                            statusFilter,
                            page: currentPage,
                            scrollTop: tableContainerRef.current?.scrollTop ?? 0,
                            productId: product.id,
                          },
                        }}
                        className={actionEditClass}
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className={actionDeleteClass}
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <span className="text-slate-400">View only</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </AdminTable>

      {!loading && totalCount > 0 && (
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}

      <AdminAlertModal
        open={Boolean(error)}
        title="Could not load products"
        message={error}
        onClose={() => setError('')}
      />
    </div>
  )
}

export default Products
