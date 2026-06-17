import { Router } from 'express'
import { deleteUser, listUsers } from '../controllers/adminUserController.js'

const router = Router()

router.get('/', listUsers)
router.delete('/:id', deleteUser)

export default router
