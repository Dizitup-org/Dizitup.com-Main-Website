import imageCompression from 'browser-image-compression'

export async function validateAndCompressImage(file: File): Promise<File> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) {
    throw new Error('Invalid image type')
  }
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  }
  const compressed = await imageCompression(file, options)
  if (compressed.size > 10 * 1024 * 1024) {
    throw new Error('File too large after compression')
  }
  return compressed
}
