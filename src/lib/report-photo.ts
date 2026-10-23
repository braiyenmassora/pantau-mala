const MAX_PHOTO_BYTES = 2 * 1024 * 1024

/** JPG/PNG/WebP; type kosong (beberapa Android) dicek lewat ekstensi. */
export function isAllowedReportPhoto(file: File): boolean {
  if (file.size <= 0 || file.size > MAX_PHOTO_BYTES) return false
  const type = file.type.toLowerCase()
  if (
    type === 'image/jpeg' ||
    type === 'image/jpg' ||
    type === 'image/pjpeg' ||
    type === 'image/png' ||
    type === 'image/webp'
  ) {
    return true
  }
  // shortcut: type kosong di sebagian Android; upgrade kalau BE terima HEIC.
  if (!type) return /\.(jpe?g|png|webp)$/i.test(file.name)
  return false
}
