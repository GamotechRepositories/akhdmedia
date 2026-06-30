export const ADMIN_PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard:view',
  HOME_CONTENT_MANAGE: 'home-content:manage',
  CATEGORIES_READ: 'categories:read',
  CATEGORIES_WRITE: 'categories:write',
  ACTORS_READ: 'actors:read',
  ACTORS_WRITE: 'actors:write',
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  PROMO_CODES_READ: 'promo-codes:read',
  PROMO_CODES_WRITE: 'promo-codes:write',
  ORDERS_READ: 'orders:read',
  TRANSACTIONS_READ: 'transactions:read',
  REVENUE_VIEW: 'revenue:view',
  USERS_MANAGE: 'users:manage',
  SUPPORT_MANAGE: 'support:manage',
  ADMINS_MANAGE: 'admins:manage',
}

export const hasAdminPermission = (admin, permission) => {
  if (!admin || !permission) return false
  if (admin.isSuperAdmin) return true

  const permissions = admin.permissions || []
  if (permissions.includes(permission)) return true

  const [module, action] = permission.split(':')
  if (!module || !action) return false

  if (action === 'read' && permissions.includes(`${module}:write`)) {
    return true
  }

  return false
}

export const hasAnyAdminPermission = (admin, required = []) =>
  required.some((permission) => hasAdminPermission(admin, permission))

export const NAV_ITEMS = [
  {
    to: '/',
    label: 'Dashboard',
    end: true,
    permission: ADMIN_PERMISSIONS.DASHBOARD_VIEW,
    description: 'Overview & tools',
  },
  {
    to: '/home-content',
    label: 'Homepage',
    permission: ADMIN_PERMISSIONS.HOME_CONTENT_MANAGE,
    description: 'Ticker & browse section',
  },
  {
    to: '/home-category-products',
    label: 'Home Products',
    permission: ADMIN_PERMISSIONS.HOME_CONTENT_MANAGE,
    description: 'Pin latest & category rows',
  },
  {
    to: '/categories',
    label: 'Categories',
    permission: ADMIN_PERMISSIONS.CATEGORIES_READ,
    description: 'Navbar & subcategories',
  },
  {
    to: '/actors',
    label: 'Actors',
    permission: ADMIN_PERMISSIONS.ACTORS_READ,
    description: 'Actor profiles & search',
  },
  {
    to: '/products',
    label: 'Products',
    permission: ADMIN_PERMISSIONS.PRODUCTS_READ,
    description: 'Videos & images',
  },
  {
    to: '/promo-codes',
    label: 'Promo Codes',
    permission: ADMIN_PERMISSIONS.PROMO_CODES_READ,
    description: 'Discount coupons',
  },
  {
    to: '/orders',
    label: 'Orders',
    permission: ADMIN_PERMISSIONS.ORDERS_READ,
    description: 'Customer purchases',
  },
  {
    to: '/transactions',
    label: 'Transactions',
    permission: ADMIN_PERMISSIONS.TRANSACTIONS_READ,
    description: 'Payments & Razorpay',
  },
  {
    to: '/revenue',
    label: 'Revenue',
    permission: ADMIN_PERMISSIONS.REVENUE_VIEW,
    description: 'Monthly records',
  },
  {
    to: '/users',
    label: 'Users',
    permission: ADMIN_PERMISSIONS.USERS_MANAGE,
    description: 'Registered customers',
  },
  {
    to: '/user-mail',
    label: 'User Mail',
    permission: ADMIN_PERMISSIONS.USERS_MANAGE,
    description: 'Email campaigns to users',
  },
  {
    to: '/support',
    label: 'Support',
    permission: ADMIN_PERMISSIONS.SUPPORT_MANAGE,
    description: 'Customer help requests',
  },
  {
    to: '/admins',
    label: 'Admin Team',
    permission: ADMIN_PERMISSIONS.ADMINS_MANAGE,
    description: 'Accounts & access',
  },
]

export const getFirstAllowedPath = (admin) => {
  const item = NAV_ITEMS.find((entry) => hasAdminPermission(admin, entry.permission))
  return item?.to || '/access-denied'
}

export const ROUTE_PERMISSIONS = [
  { path: '/', permission: ADMIN_PERMISSIONS.DASHBOARD_VIEW },
  { path: '/home-content', permission: ADMIN_PERMISSIONS.HOME_CONTENT_MANAGE },
  { path: '/home-category-products', permission: ADMIN_PERMISSIONS.HOME_CONTENT_MANAGE },
  { path: '/categories', permission: ADMIN_PERMISSIONS.CATEGORIES_READ },
  { path: '/categories/new', permission: ADMIN_PERMISSIONS.CATEGORIES_WRITE },
  { path: '/categories/:id/edit', permission: ADMIN_PERMISSIONS.CATEGORIES_WRITE },
  { path: '/actors', permission: ADMIN_PERMISSIONS.ACTORS_READ },
  { path: '/actors/new', permission: ADMIN_PERMISSIONS.ACTORS_WRITE },
  { path: '/actors/:id/edit', permission: ADMIN_PERMISSIONS.ACTORS_WRITE },
  { path: '/products', permission: ADMIN_PERMISSIONS.PRODUCTS_READ },
  { path: '/products/new', permission: ADMIN_PERMISSIONS.PRODUCTS_WRITE },
  { path: '/products/:id/edit', permission: ADMIN_PERMISSIONS.PRODUCTS_WRITE },
  { path: '/promo-codes', permission: ADMIN_PERMISSIONS.PROMO_CODES_READ },
  { path: '/promo-codes/new', permission: ADMIN_PERMISSIONS.PROMO_CODES_WRITE },
  { path: '/promo-codes/:id/edit', permission: ADMIN_PERMISSIONS.PROMO_CODES_WRITE },
  { path: '/orders', permission: ADMIN_PERMISSIONS.ORDERS_READ },
  { path: '/orders/:id', permission: ADMIN_PERMISSIONS.ORDERS_READ },
  { path: '/transactions', permission: ADMIN_PERMISSIONS.TRANSACTIONS_READ },
  { path: '/transactions/:id', permission: ADMIN_PERMISSIONS.TRANSACTIONS_READ },
  { path: '/revenue', permission: ADMIN_PERMISSIONS.REVENUE_VIEW },
  { path: '/users', permission: ADMIN_PERMISSIONS.USERS_MANAGE },
  { path: '/user-mail', permission: ADMIN_PERMISSIONS.USERS_MANAGE },
  { path: '/user-mail/:id', permission: ADMIN_PERMISSIONS.USERS_MANAGE },
  { path: '/users/:id', permission: ADMIN_PERMISSIONS.USERS_MANAGE },
  { path: '/support', permission: ADMIN_PERMISSIONS.SUPPORT_MANAGE },
  { path: '/support/:id', permission: ADMIN_PERMISSIONS.SUPPORT_MANAGE },
  { path: '/admins', permission: ADMIN_PERMISSIONS.ADMINS_MANAGE },
  { path: '/admins/new', permission: ADMIN_PERMISSIONS.ADMINS_MANAGE },
  { path: '/admins/:id/edit', permission: ADMIN_PERMISSIONS.ADMINS_MANAGE },
]

export const matchRoutePermission = (pathname) => {
  if (pathname === '/access-denied') return null

  const exact = ROUTE_PERMISSIONS.find((entry) => entry.path === pathname)
  if (exact) return exact.permission

  if (pathname.startsWith('/orders/')) return ADMIN_PERMISSIONS.ORDERS_READ
  if (pathname.startsWith('/transactions/')) return ADMIN_PERMISSIONS.TRANSACTIONS_READ
  if (pathname.startsWith('/support/')) return ADMIN_PERMISSIONS.SUPPORT_MANAGE
  if (pathname.startsWith('/user-mail/')) return ADMIN_PERMISSIONS.USERS_MANAGE
  if (pathname.startsWith('/users/')) return ADMIN_PERMISSIONS.USERS_MANAGE
  if (pathname.startsWith('/admins/')) return ADMIN_PERMISSIONS.ADMINS_MANAGE
  if (pathname.includes('/edit')) {
    if (pathname.startsWith('/products/')) return ADMIN_PERMISSIONS.PRODUCTS_WRITE
    if (pathname.startsWith('/categories/')) return ADMIN_PERMISSIONS.CATEGORIES_WRITE
    if (pathname.startsWith('/actors/')) return ADMIN_PERMISSIONS.ACTORS_WRITE
    if (pathname.startsWith('/promo-codes/')) return ADMIN_PERMISSIONS.PROMO_CODES_WRITE
  }
  if (pathname.endsWith('/new')) {
    if (pathname.startsWith('/products/')) return ADMIN_PERMISSIONS.PRODUCTS_WRITE
    if (pathname.startsWith('/categories/')) return ADMIN_PERMISSIONS.CATEGORIES_WRITE
    if (pathname.startsWith('/actors/')) return ADMIN_PERMISSIONS.ACTORS_WRITE
    if (pathname.startsWith('/promo-codes/')) return ADMIN_PERMISSIONS.PROMO_CODES_WRITE
  }

  return null
}
