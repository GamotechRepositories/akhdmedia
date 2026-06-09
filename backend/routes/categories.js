import { Router } from 'express'
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from '../controllers/categoryController.js'
import { requireAdmin, requireAdminForQuery } from '../middleware/requireAdmin.js'

const router = Router()

router.get('/', requireAdminForQuery, getCategories)
router.get('/:id', getCategoryById)
router.post('/', requireAdmin, createCategory)
router.put('/:id', requireAdmin, updateCategory)
router.delete('/:id', requireAdmin, deleteCategory)

export default router
