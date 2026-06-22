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
import userAuthRoutes from './userAuth.js'
import userOrderRoutes from './userOrders.js'
import supportRoutes from './support.js'
import adminSupportRoutes from './adminSupport.js'
import adminUserRoutes from './adminUsers.js'
import siteContentRoutes from './siteContent.js'
import actorPublicRoutes from './actors.js'
import adminSiteContentRoutes from './adminSiteContent.js'
import adminActorRoutes from './adminActors.js'
import adminPromoCodeRoutes from './adminPromoCodes.js'
import { requireAdmin } from '../middleware/requireAdmin.js'

const router = Router()

router.get('/health', (req, res) => {
  res.json({
    message: 'Backend API is running',
    timestamp: new Date().toISOString(),
  })
})

router.use('/auth', authRoutes)
router.use('/user/auth', userAuthRoutes)
router.use('/user/orders', userOrderRoutes)

router.use('/categories', categoryRoutes)
router.use('/products', productRoutes)
router.use('/cart', cartRoutes)
router.use('/orders', orderRoutes)
router.use('/admin/orders', requireAdmin, adminOrderRoutes)
router.use('/admin/transactions', requireAdmin, adminTransactionRoutes)
router.use('/admin/users', requireAdmin, adminUserRoutes)
router.use('/payments', paymentRoutes)
router.use('/support', supportRoutes)
router.use('/admin/support', requireAdmin, adminSupportRoutes)
router.use('/site-content', siteContentRoutes)
router.use('/actors', actorPublicRoutes)
router.use('/admin/site-content', requireAdmin, adminSiteContentRoutes)
router.use('/admin/actors', requireAdmin, adminActorRoutes)
router.use('/admin/promo-codes', requireAdmin, adminPromoCodeRoutes)
router.use('/upload', requireAdmin, uploadRoutes)
router.use('/files', fileRoutes)

export default router
