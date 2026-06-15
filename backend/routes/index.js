import { Router } from 'express'
import categoryRoutes from './categories.js'
import productRoutes from './products.js'
import cartRoutes from './cart.js'
import orderRoutes from './orders.js'
import adminOrderRoutes from './adminOrders.js'
import adminTransactionRoutes from './adminTransactions.js'
import paymentRoutes from './payments.js'
import uploadRoutes from './upload.js'
import fileRoutes from './files.js'
import authRoutes from './auth.js'
import supportRoutes from './support.js'
import adminSupportRoutes from './adminSupport.js'
import asyncHandler from '../utils/asyncHandler.js'
import { reseedCatalog } from '../seed/seedCatalog.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = Router()

router.get('/health', (req, res) => {
  res.json({
    message: 'Backend API is running',
    timestamp: new Date().toISOString(),
  })
})

router.use('/auth', authRoutes)

router.post(
  '/seed',
  requireAdmin,
  asyncHandler(async (req, res) => {
    await reseedCatalog()
    res.json({ message: 'Catalog reseeded successfully' })
  }),
)

router.use('/categories', categoryRoutes)
router.use('/products', productRoutes)
router.use('/cart', cartRoutes)
router.use('/orders', orderRoutes)
router.use('/admin/orders', requireAdmin, adminOrderRoutes)
router.use('/admin/transactions', requireAdmin, adminTransactionRoutes)
router.use('/payments', paymentRoutes)
router.use('/support', supportRoutes)
router.use('/admin/support', requireAdmin, adminSupportRoutes)
router.use('/upload', requireAdmin, uploadRoutes)
router.use('/files', fileRoutes)

export default router
