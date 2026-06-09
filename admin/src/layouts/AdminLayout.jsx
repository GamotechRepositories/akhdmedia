import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  IconCategories,
  IconDashboard,
  IconExternal,
  IconLogo,
  IconProducts,
} from '../components/icons/AdminIcons'

const navItems = [
  { to: '/', label: 'Dashboard', end: true, icon: IconDashboard, description: 'Overview & tools' },
  { to: '/categories', label: 'Categories', icon: IconCategories, description: 'Navbar & subcategories' },
  { to: '/products', label: 'Products', icon: IconProducts, description: 'Videos & images' },
]

const pageTitles = {
  '/': 'Dashboard',
  '/categories': 'Categories',
  '/categories/new': 'Add Category',
  '/products': 'Products',
  '/products/new': 'Add Product',
}

const AdminLayout = () => {
  const { pathname } = useLocation()
  const pageTitle =
    pageTitles[pathname] ||
    (pathname.includes('/edit') ? 'Edit' : 'Admin')

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
                FrameVault
              </p>
              <h1 className="text-lg font-bold text-white">Admin Console</h1>
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
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
          >
            <span>View Storefront</span>
            <IconExternal />
          </a>
          <p className="mt-3 px-1 text-center text-[10px] text-slate-500">
            Stock video & image marketplace
          </p>
        </div>
      </aside>

      <div className="pl-72">
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-8">
            <div>
              <p className="text-xs font-medium text-slate-400">Admin / {pageTitle}</p>
              <p className="text-sm font-semibold text-slate-900">{pageTitle}</p>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-600 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              API Connected
            </div>
          </div>
        </header>

        <main className="min-h-[calc(100vh-4rem)] px-8 py-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
