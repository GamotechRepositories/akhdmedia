import { Router } from 'express'
import {
  createAdmin,
  deleteAdmin,
  getAdmin,
  listAdmins,
  listPermissionGroups,
  updateAdmin,
} from '../controllers/adminTeamController.js'
import { requirePermission } from '../middleware/requirePermission.js'
import { ADMIN_PERMISSIONS } from '../constants/adminPermissions.js'

const router = Router()

router.get(
  '/permission-groups',
  requirePermission(ADMIN_PERMISSIONS.ADMINS_MANAGE),
  listPermissionGroups,
)
router.get('/', requirePermission(ADMIN_PERMISSIONS.ADMINS_MANAGE), listAdmins)
router.get('/:id', requirePermission(ADMIN_PERMISSIONS.ADMINS_MANAGE), getAdmin)
router.post('/', requirePermission(ADMIN_PERMISSIONS.ADMINS_MANAGE), createAdmin)
router.put('/:id', requirePermission(ADMIN_PERMISSIONS.ADMINS_MANAGE), updateAdmin)
router.delete('/:id', requirePermission(ADMIN_PERMISSIONS.ADMINS_MANAGE), deleteAdmin)

export default router
