import { Router } from 'express'
import {
  createPlan,
  deletePlan,
  getPlan,
  listPlans,
  createSubscriber,
  listSubscribers,
  getSubscriber,
  updatePlan,
  updateSubscriber,
} from '../controllers/adminSubscriptionController.js'
import { requirePermission } from '../middleware/requirePermission.js'
import { ADMIN_PERMISSIONS } from '../constants/adminPermissions.js'

const router = Router()

// Plans management
router.get(
  '/plans',
  requirePermission(ADMIN_PERMISSIONS.SUBSCRIPTIONS_READ),
  listPlans,
)

router.get(
  '/plans/:id',
  requirePermission(ADMIN_PERMISSIONS.SUBSCRIPTIONS_READ),
  getPlan,
)

router.post(
  '/plans',
  requirePermission(ADMIN_PERMISSIONS.SUBSCRIPTIONS_WRITE),
  createPlan,
)

router.put(
  '/plans/:id',
  requirePermission(ADMIN_PERMISSIONS.SUBSCRIPTIONS_WRITE),
  updatePlan,
)

router.delete(
  '/plans/:id',
  requirePermission(ADMIN_PERMISSIONS.SUBSCRIPTIONS_WRITE),
  deletePlan,
)

// Subscribers management
router.get(
  '/subscribers',
  requirePermission(ADMIN_PERMISSIONS.SUBSCRIPTIONS_READ),
  listSubscribers,
)

router.get(
  '/subscribers/:id',
  requirePermission(ADMIN_PERMISSIONS.SUBSCRIPTIONS_READ),
  getSubscriber,
)

router.post(
  '/subscribers',
  requirePermission(ADMIN_PERMISSIONS.SUBSCRIPTIONS_WRITE),
  createSubscriber,
)

router.patch(
  '/subscribers/:id',
  requirePermission(ADMIN_PERMISSIONS.SUBSCRIPTIONS_WRITE),
  updateSubscriber,
)

export default router

