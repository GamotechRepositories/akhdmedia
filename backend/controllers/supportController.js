import asyncHandler from '../utils/asyncHandler.js'
import { formatSupportRequest } from '../utils/formatSupportRequest.js'
import { buildPaginationMeta, buildTokenSearchFilter, parsePageLimit } from '../utils/pagination.js'
import {
  createSupportRequest,
  getAllSupportRequests,
  getSupportRequestById,
  replyToSupportRequest,
  updateSupportRequestStatus,
} from '../services/supportService.js'
import SupportRequest from '../models/SupportRequest.js'

const SUPPORT_SEARCH_FIELDS = [
  'ticketNumber',
  'name',
  'email',
  'phone',
  'orderNumber',
  'message',
]

const buildSupportListFilter = (query = {}) => {
  const filter = {}
  const status = String(query.status || 'all')

  if (status !== 'all') {
    filter.status = status
  }

  const searchFilter = buildTokenSearchFilter(query.search, SUPPORT_SEARCH_FIELDS)
  if (searchFilter.$and) {
    filter.$and = searchFilter.$and
  }

  return filter
}

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
  const pagination = parsePageLimit(req.query)

  if (pagination) {
    const { page, limit, skip } = pagination
    const filter = buildSupportListFilter(req.query)

    const [requests, total, openCount] = await Promise.all([
      SupportRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      SupportRequest.countDocuments(filter),
      SupportRequest.countDocuments({ status: 'open' }),
    ])

    res.json({
      success: true,
      data: {
        requests: requests.map(formatSupportRequest),
        pagination: buildPaginationMeta(page, limit, total),
        meta: { openCount },
      },
    })
    return
  }

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

export const sendSupportReply = asyncHandler(async (req, res) => {
  const request = await replyToSupportRequest(req.params.id, req.body)

  res.json({
    success: true,
    message: 'Reply sent to customer',
    data: {
      request: formatSupportRequest(request),
    },
  })
})
