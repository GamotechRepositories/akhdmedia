const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

export const getCroppedImageBlob = async (imageSrc, pixelCrop, options = 512) => {
  const normalized =
    typeof options === 'number'
      ? { maxWidth: options, maxHeight: options }
      : options

  const maxWidth = normalized.maxWidth ?? 1920
  const maxHeight = normalized.maxHeight ?? 1920
  const quality = normalized.quality ?? 0.92
  const mimeType = normalized.mimeType ?? 'image/jpeg'

  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Could not prepare image crop')
  }

  const cropWidth = Math.max(1, Math.round(pixelCrop.width))
  const cropHeight = Math.max(1, Math.round(pixelCrop.height))
  const scale = Math.min(1, maxWidth / cropWidth, maxHeight / cropHeight)
  const outputWidth = Math.max(1, Math.round(cropWidth * scale))
  const outputHeight = Math.max(1, Math.round(cropHeight * scale))

  canvas.width = outputWidth
  canvas.height = outputHeight

  context.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not create cropped image'))
          return
        }
        resolve(blob)
      },
      mimeType,
      quality,
    )
  })
}
