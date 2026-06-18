import { Router } from 'express'
import { getPublicActors } from '../controllers/actorController.js'

const router = Router()

router.get('/', getPublicActors)

export default router
