import { Router } from 'express'
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getTranscodeStatus,
  retriggerTranscode,
  updateProduct,
} from '../controllers/productController.js'

const router = Router()

router.get('/', getProducts)
router.get('/:id/transcode-status', getTranscodeStatus)
router.post('/:id/retranscode', retriggerTranscode)
router.get('/:id', getProductById)
router.post('/', createProduct)
router.put('/:id', updateProduct)
router.delete('/:id', deleteProduct)

export default router
