import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  IconActors,
  IconAdmins,
  IconCategories,
  IconDashboard,
  IconLogo,
  IconOrders,
  IconProducts,
  IconPromo,
  IconRevenue,
  IconSupport,
  IconTransactions,
  IconUsers,
} from '../components/icons/AdminIcons'
import { NAV_ITEMS } from '../constants/adminPermissions'
import { useAuth } from '../context/AuthContext'
import { BRAND } from '../config/brand'

const NAV_ICONS = {
  '/': IconDashboard,
  '/home-content': IconDashboard,
  '/home-category-products': IconProducts,
  '/categories': IconCategories,
  '/actors': IconActors,
  '/products': IconProducts,
  '/promo-codes': IconPromo,
  '/orders': IconOrders,
  '/transactions': IconTransactions,
  '/revenue': IconRevenue,
  '/users': IconUsers,
  '/support': IconSupport,
  '/admins': IconAdmins,
}

const pageTitles = {
  '/': 'Dashboard',
  '/home-content': 'Homepage Content',
  '/home-category-products': 'Homepage Products',
  '/categories': 'Categories',
  '/categories/new': 'Add Category',
  '/actors': 'Actors',
  '/actors/new': 'Add Actor',
  '/products': 'Products',
  '/products/new': 'Add Product',
  '/promo-codes': 'Promo Codes',
  '/promo-codes/new': 'Add Promo Code',
  '/orders': 'Orders',
  '/transactions': 'Transactions',
  '/revenue': 'Revenue',
  '/users': 'Users',
  '/support': 'Support',
  '/admins': 'Admin Team',
  '/admins/new': 'Add Admin',
  '/access-denied': 'Access Denied',
}

const getPageTitle = (pathname, titles) => {
  if (titles[pathname]) return titles[pathname]
  if (pathname.startsWith('/transactions/')) return 'Transaction Details'
  if (pathname.startsWith('/support/')) return 'Support Request'
  if (pathname.startsWith('/admins/')) return 'Admin Account'
  if (pathname.includes('/edit')) return 'Edit'
  return 'Admin'
}

const AdminLayout = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { admin, logout, hasPermission } = useAuth()
  const pageTitle = getPageTitle(pathname, pageTitles)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => hasPermission(item.permission)),
    [hasPermission],
  )

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen bg-[#eef2f6]">
      <div
        className={`fixed inset-0 z-30 bg-black/50 transition-opacity lg:hidden ${
          sidebarOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
        aria-hidden={!sidebarOpen}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-800/10 bg-[#0f172a] text-white transition-transform duration-300 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="text-white">
                <IconLogo />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                  {BRAND.name}
                </p>
                <h1 className="text-lg font-bold text-white">{BRAND.logoTagline}</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={closeSidebar}
              className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="admin-scrollbar flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
            Manage
          </p>
          {visibleNavItems.map((item) => {
            const Icon = NAV_ICONS[item.to] || IconDashboard
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeSidebar}
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
            <p className="mt-1 truncate text-sm font-semibold text-white">{admin?.name || BRAND.name}</p>
            <p className="truncate text-xs text-slate-400">{admin?.email}</p>
            {admin?.isSuperAdmin ? (
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-violet-300">
                Super admin
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
          >
            Log Out
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="inline-flex rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50 lg:hidden"
                aria-label="Open menu"
                aria-expanded={sidebarOpen}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-400">Admin / {pageTitle}</p>
                <p className="truncate text-sm font-semibold text-slate-900">{pageTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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

        <main className="min-h-[calc(100vh-4rem)] px-3 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
