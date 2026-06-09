import MediaUpload from './MediaUpload'

const DeliveryTierEditor = ({ tier, data = {}, isVideo, onChange }) => {
  const updateVideo = (videoKey, videoFilename = '') =>
    onChange(tier, { ...data, videoKey, videoFilename })

  const updateImage = (index, imageKey, imageFilename = '') => {
    const imageKeys = [...(data.imageKeys || ['', '', ''])]
    const imageFilenames = [...(data.imageFilenames || ['', '', ''])]
    while (imageKeys.length < 3) imageKeys.push('')
    while (imageFilenames.length < 3) imageFilenames.push('')
    imageKeys[index] = imageKey
    imageFilenames[index] = imageFilename
    onChange(tier, { ...data, imageKeys, imageFilenames })
  }

  const imageKeys = data.imageKeys?.length ? data.imageKeys : ['', '', '']

  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/40 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-900">
        {tier} — Original Files
      </p>
      <p className="mb-3 text-[11px] text-slate-500">
        Uploaded as-is — original format and filename preserved. Not visible to customers.
      </p>

      {isVideo && (
        <MediaUpload
          label="Original Video"
          accept="video/*,.mp4,.mov,.mkv,.webm,.mxf,.prores"
          uploadType="delivery-video"
          value={data.videoKey || ''}
          filename={data.videoFilename || ''}
          onChange={(key, meta) => updateVideo(key, meta?.filename || '')}
          valueKind="key"
          placeholder="Or paste file key / URL"
        />
      )}

      {!isVideo && (
        <div className="grid gap-2 sm:grid-cols-3">
          {imageKeys.map((imageKey, index) => (
            <MediaUpload
              key={index}
              label={`Original Image ${index + 1}`}
              accept="image/*,.jpg,.jpeg,.png,.webp,.tiff,.tif,.raw,.dng"
              uploadType="delivery-image"
              value={imageKey}
              filename={data.imageFilenames?.[index] || ''}
              onChange={(key, meta) => updateImage(index, key, meta?.filename || '')}
              valueKind="key"
              placeholder="Or paste file key / URL"
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default DeliveryTierEditor
