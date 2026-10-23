import { ImageOff } from 'lucide-react'
import { useState } from 'react'

import { getCopy } from '@/copy'
import { reportPhotoSrc } from '@/data/hotspot-reports'
import { cn } from '@/lib/utils'

/** True bila pemanggil sudah kunci ukuran (thumb), bukan hero aspect-ratio. */
function isFixedThumb(className?: string) {
  return Boolean(className && /\bsize-(?:\[|\d)/.test(className))
}

/** Foto laporan; gagal muat → strip ringkas (atau hilang di list compact). */
export function ReportPhoto({
  src,
  alt,
  className,
  hideOnFail = false,
}: {
  src: string
  alt: string
  className?: string
  /** List compact: jangan tampilkan kotak rusak di samping teks. */
  hideOnFail?: boolean
}) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    if (hideOnFail) return null
    const thumb = isFixedThumb(className)
    return (
      <div
        role="img"
        aria-label={getCopy().report.photoUnavailable}
        className={cn(
          className,
          'bg-surface-muted text-ink-3 flex items-center justify-center gap-2',
          // Hero: buang aspect kosong; thumb: tetap kotak kecil dari pemanggil.
          !thumb && 'aspect-auto h-auto min-h-11 object-none px-3 py-2 text-xs leading-4',
        )}
      >
        <ImageOff className="size-4 shrink-0" strokeWidth={2} aria-hidden />
        {thumb ? null : <span>{getCopy().report.photoUnavailable}</span>}
      </div>
    )
  }
  return (
    <img
      src={reportPhotoSrc(src)}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  )
}
