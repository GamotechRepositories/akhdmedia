import { Router } from 'express'
import {
  getAdminSiteContent,
  updateAdminSiteContent,
  updateHomeLatestPins,
} from '../controllers/siteSettingsController.js'

const router = Router()

router.put('/home-latest-pins', updateHomeLatestPins)
router.get('/', getAdminSiteContent)
router.put('/', updateAdminSiteContent)

export default router
