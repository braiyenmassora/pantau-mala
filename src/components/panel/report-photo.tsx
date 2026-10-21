import { ImageOff } from 'lucide-react'
import { useState } from 'react'

import { reportPhotoSrc } from '@/data/hotspot-reports'
import { cn } from '@/lib/utils'

/** Foto laporan; bila URL foto gagal dimuat tampilkan placeholder, bukan gambar rusak. */
export function ReportPhoto({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div
        aria-hidden
        className={cn(
          'bg-surface-muted text-ink-3 flex items-center justify-center',
          className,
        )}
      >
        <ImageOff className="size-5 shrink-0" strokeWidth={2} />
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
