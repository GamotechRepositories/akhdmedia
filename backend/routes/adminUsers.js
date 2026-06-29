import { Router } from 'express'
import { deleteUser, getUser, listUsers } from '../controllers/adminUserController.js'

const router = Router()

router.get('/', listUsers)
router.get('/:id', getUser)
router.delete('/:id', deleteUser)

export default router
