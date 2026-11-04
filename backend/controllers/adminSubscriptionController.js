import asyncHandler from '../utils/asyncHandler.js'
import {
  adminCreatePlan,
  adminDeletePlan,
  adminGetPlanById,
  adminGetPlans,
  adminGetSubscribers,
  adminUpdatePlan,
  adminUpdateSubscriber,
  adminAssignSubscription,
} from '../services/subscriptionService.js'

export const listPlans = asyncHandler(async (req, res) => {
  const plans = await adminGetPlans()
  res.json({
    success: true,
    data: { plans },
  })
})

export const getPlan = asyncHandler(async (req, res) => {
  const plan = await adminGetPlanById(req.params.id)
  res.json({
    success: true,
    data: { plan },
  })
})

export const createPlan = asyncHandler(async (req, res) => {
  const plan = await adminCreatePlan(req.body)
  res.status(201).json({
    success: true,
    message: 'Subscription plan created successfully',
    data: { plan },
  })
})

export const updatePlan = asyncHandler(async (req, res) => {
  const plan = await adminUpdatePlan(req.params.id, req.body)
  res.json({
    success: true,
    message: 'Subscription plan updated successfully',
    data: { plan },
  })
})

export const deletePlan = asyncHandler(async (req, res) => {
  await adminDeletePlan(req.params.id)
  res.json({
    success: true,
    message: 'Subscription plan deleted successfully',
  })
})

export const listSubscribers = asyncHandler(async (req, res) => {
  const { page, limit, search, status, planId } = req.query
  const result = await adminGetSubscribers({ page, limit, search, status, planId })
  res.json({
    success: true,
    data: result,
  })
})

export const updateSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await adminUpdateSubscriber(req.params.id, req.body)
  res.json({
    success: true,
    message: 'Subscriber updated successfully',
    data: { subscriber },
  })
})


export const createSubscriber = asyncHandler(async (req, res) => {
  const subscriber = await adminAssignSubscription(req.body)
  res.status(201).json({
    success: true,
    message: 'Subscription assigned to user successfully',
    data: { subscriber },
  })
})
