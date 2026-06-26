import { BRAND_NAME } from '../config/email.js'
import { escapeHtml } from './escapeHtml.js'

export const buildSharePageHtml = ({
  title,
  description = '',
  pageUrl,
  imageUrl = '',
  redirectUrl,
}) => {
  const safeTitle = escapeHtml(title)
  const safeDescription = escapeHtml(description || title)
  const safePageUrl = escapeHtml(pageUrl)
  const safeRedirectUrl = escapeHtml(redirectUrl || pageUrl)
  const safeImageUrl = imageUrl ? escapeHtml(imageUrl) : ''
  const imageTags = safeImageUrl
    ? `
  <meta property="og:image" content="${safeImageUrl}" />
  <meta property="og:image:alt" content="${safeTitle}" />
  <meta name="twitter:image" content="${safeImageUrl}" />`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle} — ${escapeHtml(BRAND_NAME)}</title>
  <meta name="description" content="${safeDescription}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="${escapeHtml(BRAND_NAME)}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:url" content="${safePageUrl}" />${imageTags}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  <link rel="canonical" href="${safePageUrl}" />
  <meta http-equiv="refresh" content="0;url=${safeRedirectUrl}" />
</head>
<body>
  <p>Opening <a href="${safeRedirectUrl}">${safeTitle}</a> on ${escapeHtml(BRAND_NAME)}...</p>
  <script>window.location.replace(${JSON.stringify(redirectUrl || pageUrl)});</script>
</body>
</html>`
}
