export const parseYoutubeVideoId = (url = '') => {
  const trimmed = url?.trim() || ''
  if (!trimmed) return ''

  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase()

    if (host === 'youtu.be') {
      return parsed.pathname.replace(/^\//, '').split('/')[0] || ''
    }

    if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
      const parts = parsed.pathname.split('/').filter(Boolean)

      if (parts[0] === 'shorts' && parts[1]) return parts[1]
      if (parts[0] === 'embed' && parts[1]) return parts[1]
      if (parts[0] === 'watch') return parsed.searchParams.get('v') || ''
      if (parts[0] === 'live' && parts[1]) return parts[1]
    }
  } catch {
    return ''
  }

  return ''
}

export const isValidYoutubeUrl = (url = '') => Boolean(parseYoutubeVideoId(url))

export const getYoutubeEmbedUrl = (url = '') => {
  const videoId = parseYoutubeVideoId(url)
  return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
}

export const normalizeYoutubeEmbedUrl = (url = '') => getYoutubeEmbedUrl(url)
