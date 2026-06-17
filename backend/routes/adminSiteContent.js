import { Router } from 'express'
import {
  getAdminSiteContent,
  updateAdminSiteContent,
} from '../controllers/siteSettingsController.js'

const router = Router()

router.get('/', getAdminSiteContent)
router.put('/', updateAdminSiteContent)

export default router
