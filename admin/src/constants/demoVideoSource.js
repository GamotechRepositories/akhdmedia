export const DEMO_VIDEO_SOURCES = {
  S3: 's3',
  YOUTUBE: 'youtube',
}

export const DEMO_VIDEO_SOURCE_OPTIONS = [
  {
    value: DEMO_VIDEO_SOURCES.S3,
    label: 'S3 / CloudFront',
    description: 'Upload a compressed demo MP4 to your bucket.',
  },
  {
    value: DEMO_VIDEO_SOURCES.YOUTUBE,
    label: 'YouTube Short',
    description: 'Paste a YouTube Short or video link — saved as an embed URL in the database.',
  },
]
