import { Router } from 'express'
import { getProductSharePage } from '../controllers/shareController.js'

const router = Router()

router.get('/product/:id', getProductSharePage)

export default router
