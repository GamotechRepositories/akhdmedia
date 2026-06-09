import { Router } from 'express'
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from '../controllers/productController.js'
import { requireAdmin, requireAdminForQuery } from '../middleware/requireAdmin.js'

const router = Router()

router.get('/', requireAdminForQuery, getProducts)
router.get('/:id', requireAdminForQuery, getProductById)
router.post('/', requireAdmin, createProduct)
router.put('/:id', requireAdmin, updateProduct)
router.delete('/:id', requireAdmin, deleteProduct)

export default router
