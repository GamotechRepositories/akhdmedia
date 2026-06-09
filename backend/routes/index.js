import { Router } from 'express'
import categoryRoutes from './categories.js'
import productRoutes from './products.js'
import cartRoutes from './cart.js'
import orderRoutes from './orders.js'
import uploadRoutes from './upload.js'
import fileRoutes from './files.js'
import asyncHandler from '../utils/asyncHandler.js'
import { reseedCatalog } from '../seed/seedCatalog.js'

const router = Router()

router.get('/health', (req, res) => {
  res.json({
    message: 'Backend API is running',
    timestamp: new Date().toISOString(),
  })
})

router.post(
  '/seed',
  asyncHandler(async (req, res) => {
    await reseedCatalog()
    res.json({ message: 'Catalog reseeded successfully' })
  }),
)

router.use('/categories', categoryRoutes)
router.use('/products', productRoutes)
router.use('/cart', cartRoutes)
router.use('/orders', orderRoutes)
router.use('/upload', uploadRoutes)
router.use('/files', fileRoutes)

export default router
