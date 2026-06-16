import { Router } from 'express'
import { listUsers } from '../controllers/adminUserController.js'

const router = Router()

router.get('/', listUsers)

export default router
