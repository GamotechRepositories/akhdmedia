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

export const ALL_ADMIN_PERMISSIONS = Object.values(ADMIN_PERMISSIONS)

export const ADMIN_PERMISSION_GROUPS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    permissions: [{ key: ADMIN_PERMISSIONS.DASHBOARD_VIEW, label: 'View dashboard & stats' }],
  },
  {
    id: 'home-content',
    label: 'Homepage',
    permissions: [
      { key: ADMIN_PERMISSIONS.HOME_CONTENT_MANAGE, label: 'Edit homepage ticker, browse section & category product rows' },
    ],
  },
  {
    id: 'categories',
    label: 'Categories',
    permissions: [
      { key: ADMIN_PERMISSIONS.CATEGORIES_READ, label: 'View categories' },
      { key: ADMIN_PERMISSIONS.CATEGORIES_WRITE, label: 'Create & edit categories' },
    ],
  },
  {
    id: 'actors',
    label: 'Actors',
    permissions: [
      { key: ADMIN_PERMISSIONS.ACTORS_READ, label: 'View actors' },
      { key: ADMIN_PERMISSIONS.ACTORS_WRITE, label: 'Create & edit actors' },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    permissions: [
      { key: ADMIN_PERMISSIONS.PRODUCTS_READ, label: 'View products' },
      { key: ADMIN_PERMISSIONS.PRODUCTS_WRITE, label: 'Create & edit products' },
    ],
  },
  {
    id: 'promo-codes',
    label: 'Promo codes',
    permissions: [
      { key: ADMIN_PERMISSIONS.PROMO_CODES_READ, label: 'View promo codes' },
      { key: ADMIN_PERMISSIONS.PROMO_CODES_WRITE, label: 'Create & edit promo codes' },
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    permissions: [{ key: ADMIN_PERMISSIONS.ORDERS_READ, label: 'View customer orders' }],
  },
  {
    id: 'transactions',
    label: 'Transactions',
    permissions: [{ key: ADMIN_PERMISSIONS.TRANSACTIONS_READ, label: 'View payments & Razorpay' }],
  },
  {
    id: 'revenue',
    label: 'Revenue',
    permissions: [{ key: ADMIN_PERMISSIONS.REVENUE_VIEW, label: 'View revenue reports' }],
  },
  {
    id: 'users',
    label: 'Customers',
    permissions: [{ key: ADMIN_PERMISSIONS.USERS_MANAGE, label: 'View & delete customers' }],
  },
  {
    id: 'support',
    label: 'Support',
    permissions: [{ key: ADMIN_PERMISSIONS.SUPPORT_MANAGE, label: 'View & reply to support requests' }],
  },
  {
    id: 'admins',
    label: 'Admin team',
    permissions: [{ key: ADMIN_PERMISSIONS.ADMINS_MANAGE, label: 'Create & manage admin accounts' }],
  },
]

const isValidPermission = (permission) => ALL_ADMIN_PERMISSIONS.includes(permission)

export const normalizeAdminPermissions = (permissions = []) => {
  const unique = [...new Set((permissions || []).filter(isValidPermission))]
  return unique
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
