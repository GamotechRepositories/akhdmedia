import { Router } from 'express'
import {
  createActor,
  deleteActor,
  getActorById,
  getActors,
  updateActor,
} from '../controllers/actorController.js'
import { requirePermission } from '../middleware/requirePermission.js'
import { ADMIN_PERMISSIONS } from '../constants/adminPermissions.js'

const router = Router()

router.get('/', getActors)
router.get('/:id', getActorById)
router.post('/', requirePermission(ADMIN_PERMISSIONS.ACTORS_WRITE), createActor)
router.put('/:id', requirePermission(ADMIN_PERMISSIONS.ACTORS_WRITE), updateActor)
router.delete('/:id', requirePermission(ADMIN_PERMISSIONS.ACTORS_WRITE), deleteActor)

export default router
