import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { deleteProduct, fetchProducts } from '../api/client'
import AdminAlertModal from '../components/AdminAlertModal'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { cardClass, inputClass, primaryBtnClass } from '../components/ui/adminUi'

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

const buildProductSearchText = (product) =>
  [
    product.id,
    product.name,
    product.clipId,
    product.mediaType,
    product.mediaType === 'image' ? 'stock image' : 'video clip',
    product.category,
    product.categorySlug,
    product.subCategory,
    product.brand,
    product.description,
    product.pricingMode,
    String(product.price ?? ''),
    formatCurrency(product.price),
    product.isActive ? 'active' : 'inactive',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

const matchesSearch = (product, query) => {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  const haystack = buildProductSearchText(product)
  const tokens = normalized.split(/\s+/).filter(Boolean)
  return tokens.every((token) => haystack.includes(token))
}

const Products = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const tableContainerRef = useRef(null)
  const restore = location.state?.restore

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState(restore?.searchQuery || '')
  const [typeFilter, setTypeFilter] = useState(restore?.typeFilter || 'all')
  const [categoryFilter, setCategoryFilter] = useState(restore?.categoryFilter || 'all')
  const [statusFilter, setStatusFilter] = useState(restore?.statusFilter || 'all')
  const [highlightedId, setHighlightedId] = useState('')

  const loadProducts = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetchProducts()
      setProducts(response.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    const nextRestore = location.state?.restore
    if (!nextRestore || loading) return

    if (nextRestore.searchQuery !== undefined) setSearchQuery(nextRestore.searchQuery)
    if (nextRestore.typeFilter) setTypeFilter(nextRestore.typeFilter)
    if (nextRestore.categoryFilter) setCategoryFilter(nextRestore.categoryFilter)
    if (nextRestore.statusFilter) setStatusFilter(nextRestore.statusFilter)

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
  }, [loading, location.state, navigate])

  const categoryOptions = useMemo(() => {
    const categories = [...new Set(products.map((product) => product.category).filter(Boolean))]
    return categories.sort((a, b) => a.localeCompare(b))
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (typeFilter !== 'all' && product.mediaType !== typeFilter) {
        return false
      }

      if (categoryFilter !== 'all' && product.category !== categoryFilter) {
        return false
      }

      if (statusFilter === 'active' && !product.isActive) {
        return false
      }

      if (statusFilter === 'inactive' && product.isActive) {
        return false
      }

      return matchesSearch(product, searchQuery)
    })
  }, [products, typeFilter, categoryFilter, statusFilter, searchQuery])

  const hasActiveFilters =
    searchQuery.trim() ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all'

  const clearFilters = () => {
    setSearchQuery('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setStatusFilter('all')
  }

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete product "${product.name}"?`)) return

    try {
      await deleteProduct(product.id)
      await loadProducts()
    } catch (err) {
      window.alert(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage video clips and stock images shown on the storefront."
        action={
          <Link to="/products/new" className={primaryBtnClass}>
            Add Product
          </Link>
        }
      />

      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1">
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
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Type
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
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
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={inputClass}
            >
              <option value="all">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
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
              onChange={(e) => setStatusFilter(e.target.value)}
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
            Showing {filteredProducts.length} of {products.length} products
          </p>
        )}
      </div>

      <div
        ref={tableContainerRef}
        className={`${cardClass} max-h-[min(60vh,640px)] min-h-[240px] overflow-y-auto`}
      >
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading products...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {products.length === 0
                    ? 'No products found.'
                    : 'No products match your search or filters.'}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  id={`product-row-${product.id}`}
                  className={`hover:bg-slate-50/80 ${
                    highlightedId === product.id ? 'bg-amber-50 ring-1 ring-inset ring-amber-200' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{product.name}</p>
                    {product.clipId && (
                      <p className="mt-0.5 font-mono text-[11px] text-slate-500">{product.clipId}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase text-slate-700">
                      {product.mediaType === 'image' ? 'Image' : 'Video'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.category}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(product.price)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge active={product.isActive} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/products/${product.id}/edit`}
                      state={{
                        fromList: {
                          searchQuery,
                          typeFilter,
                          categoryFilter,
                          statusFilter,
                          scrollTop: tableContainerRef.current?.scrollTop ?? 0,
                          productId: product.id,
                        },
                      }}
                      className="mr-3 font-semibold text-slate-900 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(product)}
                      className="font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
