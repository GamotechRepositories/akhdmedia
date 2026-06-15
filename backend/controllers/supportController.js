import asyncHandler from '../utils/asyncHandler.js'
import { formatSupportRequest } from '../utils/formatSupportRequest.js'
import {
  createSupportRequest,
  getAllSupportRequests,
  getSupportRequestById,
  updateSupportRequestStatus,
} from '../services/supportService.js'

export const submitSupportRequest = asyncHandler(async (req, res) => {
  const request = await createSupportRequest(req.body, req.sessionId)

  res.status(201).json({
    success: true,
    message: 'Support request submitted successfully',
    data: {
      request: formatSupportRequest(request),
    },
  })
})

export const listSupportRequests = asyncHandler(async (req, res) => {
  const requests = await getAllSupportRequests()

  res.json({
    success: true,
    data: {
      requests: requests.map(formatSupportRequest),
    },
  })
})

export const getSupportRequest = asyncHandler(async (req, res) => {
  const request = await getSupportRequestById(req.params.id)

  res.json({
    success: true,
    data: {
      request: formatSupportRequest(request),
    },
  })
})

export const patchSupportRequest = asyncHandler(async (req, res) => {
  const request = await updateSupportRequestStatus(req.params.id, req.body)

  res.json({
    success: true,
    message: 'Support request updated',
    data: {
      request: formatSupportRequest(request),
    },
  })
})
