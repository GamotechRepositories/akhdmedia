import { getPrivateDownloadUrl } from '../services/storageService.js'

/** Persists a signed URL snapshot on the product document for manual DB access only. */
export const attachMasterVideoSignedUrl = async (payload = {}) => {
  const key = payload.masterVideoKey?.trim() || ''

  if (!key) {
    payload.masterVideoSignedUrl = ''
    return payload
  }

  const url = await getPrivateDownloadUrl(key, payload.masterVideoFilename?.trim() || '', {
    inline: true,
  })

  payload.masterVideoSignedUrl = url || ''
  return payload
}
