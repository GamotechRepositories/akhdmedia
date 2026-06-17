import { Router } from 'express'
import { getPublicSiteContent } from '../controllers/siteSettingsController.js'

const router = Router()

router.get('/', getPublicSiteContent)

export default router
