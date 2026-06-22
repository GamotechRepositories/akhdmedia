import { Router } from 'express'
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  reserveClipId,
  updateProduct,
} from '../controllers/productController.js'
import { requireAdmin } from '../middleware/requireAdmin.js'
import { requireAdminQueryPermission, requirePermission } from '../middleware/requirePermission.js'
import { ADMIN_PERMISSIONS } from '../constants/adminPermissions.js'

const router = Router()

router.get('/', requireAdminQueryPermission(ADMIN_PERMISSIONS.PRODUCTS_READ), getProducts)
router.get(
  '/reserve-clip-id',
  requireAdmin,
  requirePermission(ADMIN_PERMISSIONS.PRODUCTS_WRITE),
  reserveClipId,
)
router.get('/:id', requireAdminQueryPermission(ADMIN_PERMISSIONS.PRODUCTS_READ), getProductById)
router.post('/', requireAdmin, requirePermission(ADMIN_PERMISSIONS.PRODUCTS_WRITE), createProduct)
router.put('/:id', requireAdmin, requirePermission(ADMIN_PERMISSIONS.PRODUCTS_WRITE), updateProduct)
router.delete('/:id', requireAdmin, requirePermission(ADMIN_PERMISSIONS.PRODUCTS_WRITE), deleteProduct)

export default router
