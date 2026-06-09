import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import { cardClass, primaryBtnClass } from '../components/ui/adminUi'
import { fetchCategories, fetchProducts, reseedCatalog } from '../api/client'

const Dashboard = () => {
  const [stats, setStats] = useState({ categories: 0, products: 0 })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const loadStats = async () => {
    setLoading(true)
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        fetchCategories(),
        fetchProducts(),
      ])
      setStats({
        categories: categoriesRes.data.length,
        products: productsRes.data.length,
      })
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  const handleReseed = async () => {
    if (!window.confirm('This will reset all categories and products. Continue?')) return

    try {
      await reseedCatalog()
      setMessage('Catalog reseeded successfully.')
      await loadStats()
    } catch (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Manage categories and products for the FrameVault storefront."
      />

      {message && (
        <div className={`${cardClass} px-5 py-4 text-sm text-slate-700`}>{message}</div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className={`${cardClass} p-7`}>
          <p className="text-sm font-medium text-slate-500">Total Categories</p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            {loading ? '—' : stats.categories}
          </p>
          <Link to="/categories" className="mt-6 inline-flex text-sm font-semibold text-slate-900 hover:underline">
            Manage categories →
          </Link>
        </div>

        <div className={`${cardClass} p-7`}>
          <p className="text-sm font-medium text-slate-500">Total Products</p>
          <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            {loading ? '—' : stats.products}
          </p>
          <Link to="/products" className="mt-6 inline-flex text-sm font-semibold text-slate-900 hover:underline">
            Manage products →
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50 p-7 shadow-sm">
        <h3 className="text-lg font-semibold text-amber-950">Developer Tools</h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-amber-900/80">
          Reseed the database with default categories and products from the original mock data.
        </p>
        <button type="button" onClick={handleReseed} className={`${primaryBtnClass} mt-5 bg-amber-950 hover:bg-amber-900`}>
          Reseed Catalog
        </button>
      </div>
    </div>
  )
}

export default Dashboard
