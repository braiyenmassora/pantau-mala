export const REPORT_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
export const MAX_REPORT_PHOTO_INPUT_BYTES = 12 * 1024 * 1024
export const MAX_REPORT_PHOTO_OUTPUT_BYTES = 700 * 1024
export const MAX_REPORT_PHOTO_EDGE = 1600

const WEBP_QUALITIES = [0.82, 0.74, 0.66, 0.58]
const MIN_REPORT_PHOTO_EDGE = 480

export type OptimizedReportPhoto = {
  file: File
  originalName: string
  originalBytes: number
  originalWidth: number
  originalHeight: number
  outputWidth: number
  outputHeight: number
}

function outputName(name: string) {
  const base = name.replace(/\.[^.]+$/, '').trim() || 'laporan-warga'
  return `${base}.webp`
}

export function reportPhotoDimensions(width: number, height: number, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(width, height))
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function encodeWebP(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob || blob.type !== 'image/webp') {
          reject(new Error('Browser tidak mendukung optimasi WebP.'))
          return
        }
        resolve(blob)
      },
      'image/webp',
      quality,
    )
  })
}

export async function optimizeReportPhoto(file: File): Promise<OptimizedReportPhoto> {
  if (!REPORT_PHOTO_TYPES.has(file.type)) {
    throw new Error('Format foto harus JPEG, PNG, atau WebP.')
  }
  if (file.size < 1 || file.size > MAX_REPORT_PHOTO_INPUT_BYTES) {
    throw new Error('Foto asli maksimal 12 MiB.')
  }
  if (typeof createImageBitmap !== 'function') {
    throw new Error('Browser ini belum mendukung optimasi foto.')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('Foto tidak dapat dibaca. Pilih JPEG, PNG, atau WebP yang valid.')
  }

  try {
    const originalWidth = bitmap.width
    const originalHeight = bitmap.height
    if (originalWidth < 1 || originalHeight < 1) {
      throw new Error('Dimensi foto tidak valid.')
    }

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Browser gagal menyiapkan foto.')

    let dimensions = reportPhotoDimensions(
      originalWidth,
      originalHeight,
      MAX_REPORT_PHOTO_EDGE,
    )
    let smallest: { blob: Blob; width: number; height: number } | undefined

    while (Math.max(dimensions.width, dimensions.height) >= MIN_REPORT_PHOTO_EDGE) {
      canvas.width = dimensions.width
      canvas.height = dimensions.height
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

      for (const quality of WEBP_QUALITIES) {
        const blob = await encodeWebP(canvas, quality)
        if (!smallest || blob.size < smallest.blob.size) {
          smallest = { blob, width: canvas.width, height: canvas.height }
        }
        if (blob.size <= MAX_REPORT_PHOTO_OUTPUT_BYTES) {
          return {
            file: new File([blob], outputName(file.name), {
              type: 'image/webp',
              lastModified: Date.now(),
            }),
            originalName: file.name,
            originalBytes: file.size,
            originalWidth,
            originalHeight,
            outputWidth: canvas.width,
            outputHeight: canvas.height,
          }
        }
      }

      dimensions = reportPhotoDimensions(
        dimensions.width,
        dimensions.height,
        Math.max(
          MIN_REPORT_PHOTO_EDGE,
          Math.floor(Math.max(dimensions.width, dimensions.height) * 0.8),
        ),
      )
      if (Math.max(dimensions.width, dimensions.height) === MIN_REPORT_PHOTO_EDGE) {
        canvas.width = dimensions.width
        canvas.height = dimensions.height
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        const blob = await encodeWebP(canvas, WEBP_QUALITIES.at(-1) ?? 0.58)
        if (blob.size <= MAX_REPORT_PHOTO_OUTPUT_BYTES) {
          return {
            file: new File([blob], outputName(file.name), {
              type: 'image/webp',
              lastModified: Date.now(),
            }),
            originalName: file.name,
            originalBytes: file.size,
            originalWidth,
            originalHeight,
            outputWidth: canvas.width,
            outputHeight: canvas.height,
          }
        }
        break
      }
    }

    if (smallest) throw new Error('Foto masih terlalu besar setelah dioptimalkan.')
    throw new Error('Foto gagal dioptimalkan.')
  } finally {
    bitmap.close()
  }
}

export function formatPhotoBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024)).toLocaleString('id-ID')} KB`
  }
  return `${(bytes / 1024 / 1024).toLocaleString('id-ID', {
    maximumFractionDigits: 1,
  })} MiB`
}
