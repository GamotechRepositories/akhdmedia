import { Router } from 'express'
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  getHomeCategoryPins,
  updateCategory,
  updateCategoryHomePins,
} from '../controllers/categoryController.js'
import { requireAdmin, requireAdminForQuery } from '../middleware/requireAdmin.js'
import { requireAdminQueryPermission, requirePermission } from '../middleware/requirePermission.js'
import { ADMIN_PERMISSIONS } from '../constants/adminPermissions.js'

const router = Router()

router.get(
  '/',
  requireAdminQueryPermission(
    ADMIN_PERMISSIONS.CATEGORIES_READ,
    ADMIN_PERMISSIONS.PRODUCTS_READ,
    ADMIN_PERMISSIONS.PRODUCTS_WRITE,
  ),
  getCategories,
)
router.get(
  '/home-pins',
  requireAdmin,
  requirePermission(ADMIN_PERMISSIONS.HOME_CONTENT_MANAGE),
  getHomeCategoryPins,
)
router.get('/:id', requireAdminForQuery, getCategoryById)
router.post('/', requireAdmin, requirePermission(ADMIN_PERMISSIONS.CATEGORIES_WRITE), createCategory)
router.put('/:id', requireAdmin, requirePermission(ADMIN_PERMISSIONS.CATEGORIES_WRITE), updateCategory)
router.put(
  '/:id/home-pins',
  requireAdmin,
  requirePermission(ADMIN_PERMISSIONS.HOME_CONTENT_MANAGE),
  updateCategoryHomePins,
)
router.delete(
  '/:id',
  requireAdmin,
  requirePermission(ADMIN_PERMISSIONS.CATEGORIES_WRITE),
  deleteCategory,
)

export default router
