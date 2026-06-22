import asyncHandler from '../utils/asyncHandler.js'
import AppError from '../utils/AppError.js'
import { hasAnyAdminPermission } from '../constants/adminPermissions.js'
import { getAdminById } from '../services/authService.js'
import { requireAdmin } from './requireAdmin.js'

const loadAdminProfile = async (req) => {
  if (req.adminProfile) return req.adminProfile
  const profile = await getAdminById(req.admin.id)
  req.adminProfile = profile
  return profile
}

export const requirePermission = (...required) =>
  asyncHandler(async (req, res, next) => {
    const profile = await loadAdminProfile(req)

    if (!hasAnyAdminPermission(profile, required)) {
      throw new AppError('You do not have permission to perform this action', 403)
    }

    return next()
  })

export const requireAdminQueryPermission = (...required) => (req, res, next) => {
  if (req.query.admin !== 'true') {
    return next()
  }

  return requireAdmin(req, res, (error) => {
    if (error) return next(error)
    return requirePermission(...required)(req, res, next)
  })
}
