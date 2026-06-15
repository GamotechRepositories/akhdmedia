import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  IconCategories,
  IconDashboard,
  IconExternal,
  IconLogo,
  IconOrders,
  IconProducts,
  IconSupport,
  IconTransactions,
} from '../components/icons/AdminIcons'
import { useAuth } from '../context/AuthContext'
import { BRAND } from '../config/brand'

const navItems = [
  { to: '/', label: 'Dashboard', end: true, icon: IconDashboard, description: 'Overview & tools' },
  { to: '/categories', label: 'Categories', icon: IconCategories, description: 'Navbar & subcategories' },
  { to: '/products', label: 'Products', icon: IconProducts, description: 'Videos & images' },
  { to: '/orders', label: 'Orders', icon: IconOrders, description: 'Customer purchases' },
  { to: '/transactions', label: 'Transactions', icon: IconTransactions, description: 'Payments & Razorpay' },
  { to: '/support', label: 'Support', icon: IconSupport, description: 'Customer help requests' },
]

const pageTitles = {
  '/': 'Dashboard',
  '/categories': 'Categories',
  '/categories/new': 'Add Category',
  '/products': 'Products',
  '/products/new': 'Add Product',
  '/orders': 'Orders',
  '/transactions': 'Transactions',
  '/support': 'Support',
}

const getPageTitle = (pathname, pageTitles) => {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith('/transactions/')) return 'Transaction Details'
  if (pathname.startsWith('/support/')) return 'Support Request'
  if (pathname.includes('/edit')) return 'Edit'
  return 'Admin'
}

const AdminLayout = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { admin, logout } = useAuth()
  const pageTitle = getPageTitle(pathname, pageTitles)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#eef2f6]">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-800/10 bg-[#0f172a] text-white">
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="text-white">
              <IconLogo />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                {BRAND.name}
              </p>
              <h1 className="text-lg font-bold text-white">{BRAND.logoTagline}</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Manage
          </p>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `group flex items-start gap-3 rounded-xl px-3 py-3 transition-all ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-lg shadow-black/20'
                      : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        isActive ? 'bg-slate-900 text-white' : 'bg-white/10 text-slate-200 group-hover:bg-white/15'
                      }`}
                    >
                      <Icon />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span
                        className={`mt-0.5 block text-xs ${
                          isActive ? 'text-slate-500' : 'text-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        {item.description}
                      </span>
                    </span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Signed in as
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {admin?.name || 'AKHDMEDIA'}
            </p>
            <p className="truncate text-xs text-slate-400">{admin?.email}</p>
          </div>
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="mb-2 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            <span>View Storefront</span>
            <IconExternal />
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
          >
            Log Out
          </button>
        </div>
      </aside>

      <div className="pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-8">
            <div>
              <p className="text-xs font-medium text-slate-400">Admin / {pageTitle}</p>
              <p className="text-sm font-semibold text-slate-900">{pageTitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-600 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                API Connected
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Log Out
              </button>
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] px-8 py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
