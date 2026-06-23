export const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const parsePageLimit = (query = {}) => {
  const page = Number.parseInt(query.page, 10)
  const limit = Number.parseInt(query.limit, 10)
  const usePagination =
    Number.isFinite(page) && page > 0 && Number.isFinite(limit) && limit > 0

  if (!usePagination) {
    return null
  }

  const safeLimit = Math.min(Math.max(limit, 1), 100)
  const skip = (page - 1) * safeLimit

  return { page, limit: safeLimit, skip }
}

export const buildTokenSearchFilter = (search, fields = []) => {
  const normalized = String(search || '').trim()
  if (!normalized || !fields.length) return {}

  const tokens = normalized.split(/\s+/).filter(Boolean)
  const tokenFilters = tokens.map((token) => {
    const regex = new RegExp(escapeRegex(token), 'i')
    return {
      $or: fields.map((field) => ({ [field]: regex })),
    }
  })

  return tokenFilters.length ? { $and: tokenFilters } : {}
}

export const buildPaginationMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
})
