export const formatFileSize = (bytes) => {
  if (!bytes || bytes < 1) return ''
  const gb = bytes / 1024 ** 3
  if (gb >= 1) return `${gb.toFixed(2)} GB`
  const mb = bytes / 1024 ** 2
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  const kb = bytes / 1024
  return `${kb.toFixed(0)} KB`
}

export const formatUploadSpeed = (bytesPerSec) => {
  if (!bytesPerSec || bytesPerSec < 1) return '—'
  const mbps = (bytesPerSec * 8) / 1024 ** 2
  if (mbps >= 1) return `${mbps.toFixed(1)} Mbps`
  const mbPerSec = bytesPerSec / 1024 ** 2
  return `${mbPerSec.toFixed(1)} MB/s`
}

export const formatUploadEta = (loaded, total, speedBps) => {
  if (!speedBps || speedBps < 1 || !total) return ''
  const remaining = (total - loaded) / speedBps
  if (remaining < 1) return '< 1s left'
  const mins = Math.floor(remaining / 60)
  const secs = Math.floor(remaining % 60)
  return mins > 0 ? `${mins}m ${secs}s left` : `${secs}s left`
}
