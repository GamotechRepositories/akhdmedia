export function createPaginatedLoader() {
  const pageCache = new Map()
  const inFlight = new Map()

  const clear = () => {
    pageCache.clear()
    inFlight.clear()
  }

  const load = async ({ cacheKey, force = false, fetchPage }) => {
    if (!force) {
      const cached = pageCache.get(cacheKey)
      if (cached) return cached

      const pending = inFlight.get(cacheKey)
      if (pending) return pending
    }

    const request = (async () => {
      const result = await fetchPage()
      pageCache.set(cacheKey, result)
      return result
    })()

    if (!force) {
      inFlight.set(cacheKey, request)
    }

    try {
      return await request
    } finally {
      inFlight.delete(cacheKey)
    }
  }

  return { load, clear }
}

export const buildPageCacheKey = (namespace, page, filters = {}) => {
  const filterKey = Object.entries(filters)
    .map(([key, value]) => `${key}=${value}`)
    .join('|')
  return `${namespace}::${filterKey}::${page}`
}
